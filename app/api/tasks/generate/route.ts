import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

// 🔥 1. IN-MEMORY LOCK: Instantly blocks React Strict Mode double-fires & rapid clicks
const activeGenerationLocks = new Set();

export async function POST(request: Request) {
let requestUserId: string | null = null;

  try {
    const body = await request.json();
    let { 
      user_id, user_name, track, deadline_display, experience_level, 
      difficulty, task_number, user_city, include_ethical_trap, model, include_video_brief 
    } = body;

    requestUserId = user_id;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields: user_id' }, { status: 400 });
    }

    // CHECK MEMORY LOCK
    if (activeGenerationLocks.has(user_id)) {
      return NextResponse.json({ success: false, error: 'Task generation is already processing.' }, { status: 429 });
    }
    activeGenerationLocks.add(user_id);

    const dbClient = supabaseAdmin || supabase;

    // 🔥 2. DB COOLDOWN LOCK: 15-second mandatory wait between task generations
    const { data: recentTasks } = await dbClient
      .from('tasks')
      .select('created_at')
      .eq('user', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentTasks && recentTasks.length > 0) {
      const timeSinceLastTask = new Date().getTime() - new Date(recentTasks[0].created_at).getTime();
      if (timeSinceLastTask < 15000) { 
        return NextResponse.json({ success: false, error: 'Please wait a few seconds before generating another task.' }, { status: 429 });
      }
    }

    // Intelligent Track Fallback
    if (!track || track.trim() === '') {
      const { data: userData } = await dbClient.from('users').select('track').eq('auth_id', user_id).maybeSingle();
      track = userData?.track || "general";
    }

    // Correctly Calculate Task Number
    const { count, error: countError } = await dbClient.from('tasks').select('*', { count: 'exact', head: true }).eq('user', user_id);
    if (countError) console.error("Count Error:", countError);
    const calculatedTaskNumber = (count || 0) + 1;

    // Existing Active Task Lock
    const { data: existingActiveTask } = await dbClient
      .from('tasks')
      .select('id, status, task_number')
      .eq('user', user_id)
      .eq('task_number', calculatedTaskNumber)
      .maybeSingle();

    if (existingActiveTask) {
      return NextResponse.json({ success: false, error: `Access Denied: Active task already exists.` }, { status: 403 });
    }

    // Insert generating placeholder
    await dbClient.from('tasks').insert({
      user: user_id,
      task_number: calculatedTaskNumber,
      status: 'generating',
      title: 'Generating Assignment...',
      task_track: track
    });

    // Calculate Unified Friday Deadline
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const fridayDate = new Date(now);
    fridayDate.setDate(now.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    const formattedDeadline = `Friday, ${fridayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at 11:59 PM`;

    // Fetch Previous Performance
    let previousPerformance = "N/A";
    const { data: lastTask } = await dbClient.from('tasks').select('id').eq('user', user_id).eq('completed', true).order('id', { ascending: false }).limit(1).maybeSingle(); 
    if (lastTask) {
      const { data: lastMsg } = await dbClient.from('chat_history').select('content').eq('task_id', lastTask.id).eq('role', 'assistant').order('created_at', { ascending: false }).limit(1).maybeSingle(); 
      if (lastMsg) previousPerformance = lastMsg.content;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';

    // Trigger Python Background Queue
    const backendResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body, track: track, user_name: user_name || "Intern", task_number: calculatedTaskNumber,
        deadline_display: formattedDeadline, previous_performance: previousPerformance
      })
    });

    if (!backendResponse.ok) {
      await dbClient.from('tasks').delete().eq('user', user_id).eq('status', 'generating');
      return NextResponse.json({ success: false, error: "The system couldn't reach the queue." }, { status: backendResponse.status });
    }

    return NextResponse.json({ success: true, message: "Task generation queued successfully." });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    // 🔥 ALWAYS release the memory lock after 10 seconds to ensure the user isn't permanently locked out if a crash occurs
    if (requestUserId) {
      setTimeout(() => activeGenerationLocks.delete(requestUserId), 10000);
    }
  }
}