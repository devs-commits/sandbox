import { NextResponse } from 'next/server';

// 🔥 CRITICAL: Prevents Vercel from timing out the AI request
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const { user_id, tasks, user_name, track, start_date, end_date, feedback } = await request.json();

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const backendResponse = await fetch(`${BACKEND_URL}/generate-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        user_name,
        track,
        start_date,
        end_date,
        feedback: Object.entries(feedback || {}).map(([taskId, text]) => ({
          task_id: Number(taskId),
          feedback: text
        })),
        tasks
      })
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend Error:", errorText);
      throw new Error(`Backend failed with status ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json({ resume: data.cv_content });

  } catch (error: any) {
    console.error("Resume API Error:", error);
    // If it still fails, use a much cleaner fallback format
    return NextResponse.json({ 
        resume: generateFallbackResume(await request.json().catch(()=>({tasks: []}))) 
    });
  }
}

function generateFallbackResume(data: any) {
  const tasks = data.tasks || [];
  const tracks = [...new Set(tasks.map((t: any) => t.task_track))].join(", ");
  
  return `
# ${data.user_name || "WDC Candidate"}
**${tracks.toUpperCase() || "PROFESSIONAL"} SPECIALIST**

---

## PROFESSIONAL SUMMARY
Dedicated and practical professional with hands-on simulated experience in ${tracks}. Successfully completed ${tasks.length} industry-standard technical tasks, demonstrating a strong ability to solve real-world business problems and deliver actionable results.

## CORE COMPETENCIES
* Practical Problem Solving
* Technical Execution
* Project Delivery
* Cross-functional Communication

## PROFESSIONAL EXPERIENCE
**WDC Labs** | *Virtual Intern*
*Completed intensive, real-world task simulations graded by AI technical supervisors.*

${tasks.map((t: any) => `* **${t.title}**: ${t.brief_content.substring(0, 100)}...`).join('\n')}
`;
}