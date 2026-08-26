import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🔥 Added Supabase Admin client so we can modify the database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CRITICAL FIX: Forces Vercel to keep the connection open for the AI to finish
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body; // Grab the user ID from the request
    
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';

    const pythonResponse = await fetch(`${AI_BACKEND_URL}/regenerate-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await pythonResponse.json();

    if (!pythonResponse.ok) {
        return NextResponse.json(
            { error: data.detail || data.error || "Failed to regenerate task" }, 
            { status: pythonResponse.status }
        );
    }
    
    // 🔥 CLEANUP PLACEHOLDERS IN DB
    if (user_id) {
      try {
        const { data: latestTask } = await supabaseAdmin
          .from('tasks')
          .select('id, brief_content')
          .eq('user', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestTask && latestTask.brief_content) {
          const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          
          const fixedContent = latestTask.brief_content
            .replace(/\[Date of Assignment\]/gi, currentDate)
            .replace(/\[Deadline Date & Time\]/gi, `${deadlineDate} at 11:59 PM`)
            .replace(/\[Insert Date\]/gi, currentDate);

          if (fixedContent !== latestTask.brief_content) {
            await supabaseAdmin.from('tasks').update({ brief_content: fixedContent }).eq('id', latestTask.id);
          }
        }
      } catch (cleanupError) {
        console.error('Failed to clean up placeholders:', cleanupError);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}