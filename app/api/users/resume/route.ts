import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, tasks, user_name, track, start_date, end_date, feedback } = await request.json();


    // 1. Call Python Backend for Resume Generation
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
      throw new Error(`Backend failed with status ${backendResponse.status}: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log("Resume API Response:", data);
    return NextResponse.json({ resume: data.cv_content });

  } catch (error: any) {
    console.error("Resume API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function generateFallbackResume(tasks: any[]) {
  const tracks = [...new Set(tasks.map((t: any) => t.task_track))].join(", ");
  return `**Professional Summary**\n\nDedicated and practical learner with hands-on experience in ${tracks}. Successfully completed ${tasks.length} industry-simulated tasks, demonstrating ability to solve real-world problems.\n\n**Key Projects**\n${tasks.map((t: any) => `- ${t.title}: ${t.brief_content}`).join('\n')}`;
}
