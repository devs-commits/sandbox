import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      user_id, user_name, track, deadline_display, experience_level, 
      difficulty, task_number, user_city, include_ethical_trap, model, include_video_brief 
    } = body;

    if (!user_id || !track) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const dbClient = supabaseAdmin || supabase;

    // 1. Correctly Calculate Task Number
    const { count, error: countError } = await dbClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user', user_id);

    if (countError) console.error("Count Error:", countError);
    const calculatedTaskNumber = (count || 0) + 1;

    // 2. Fetch Previous Performance (Safely for new users)
    let previousPerformance = "N/A";
    const { data: lastTask, error: lastTaskError } = await dbClient
      .from('tasks')
      .select('id')
      .eq('user', user_id)
      .eq('completed', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(); // 🔥 THE FIX: Changed from .single() to .maybeSingle()

    if (lastTask && !lastTaskError) {
      const { data: lastMsg } = await dbClient
        .from('chat_history')
        .select('content')
        .eq('task_id', lastTask.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // 🔥 THE FIX: Changed from .single() to .maybeSingle()

      if (lastMsg) previousPerformance = lastMsg.content;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';

    // 3. Trigger Python Background Queue
    const backendResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        user_name: user_name || "Intern",
        task_number: calculatedTaskNumber,
        previous_performance: previousPerformance
      })
    });

    if (!backendResponse.ok) {
      const errText = await backendResponse.text();
      console.error("Backend generation error:", errText);
      throw new Error(`Backend API Error: ${backendResponse.status}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Task generation queued successfully." 
    });

  } catch (error: any) {
    console.error('Error queuing task:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}