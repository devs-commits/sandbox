import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, tasks } = await request.json();

    if (!userId || !tasks || tasks.length === 0) {
      return NextResponse.json({ 
        resume: "Complete some tasks to generate your AI resume! Once you've finished a few simulations, I'll be able to write a professional summary of your experience." 
      });
    }

    // 1. Call Python Backend for Resume Generation
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    const backendResponse = await fetch(`${BACKEND_URL}/generate-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            tasks
        })
    });

    if (!backendResponse.ok) {
        // Fallback if backend fails or endpoint doesn't exist yet
        console.warn("Backend resume generation failed, using fallback.");
        return NextResponse.json({ 
            resume: generateFallbackResume(tasks)
        });
    }

    const data = await backendResponse.json();
    return NextResponse.json({ resume: data.resume });

  } catch (error: any) {
    console.error("Resume API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function generateFallbackResume(tasks: any[]) {
    const tracks = [...new Set(tasks.map((t: any) => t.task_track))].join(", ");
    return `**Professional Summary**\n\nDedicated and practical learner with hands-on experience in ${tracks}. Successfully completed ${tasks.length} industry-simulated tasks, demonstrating ability to solve real-world problems.\n\n**Key Projects**\n${tasks.map((t: any) => `- ${t.title}: ${t.brief_content}`).join('\n')}`;
}
