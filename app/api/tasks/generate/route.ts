import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Default AI persona configuration
const DEFAULT_AI_PERSONA_CONFIG = {
  role: "Mentor",
  tone: "encouraging",
  expertise: "general",
  instruction: "Complete the task as described.",
  duration: "1 hour"
};

interface TaskDefinition {
  title: string;
  brief_content: string;
  difficulty: string;
  ai_persona_config?: {
    role: string;
    tone: string;
    expertise: string;
    instruction: string;
    duration: string;
  };
  location?: {
    city?: string;
    country?: string;
    country_code?: string;
  };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      user_id,
      user_name,
      track,
      difficulty,
      task_number,
      user_city,
      include_ethical_trap,
      model,
      include_video_brief } = body;
    console.log("Generating tasks for user:", user_id, "track:", track, "user_city:", user_city);

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is missing' },
        { status: 400 }
      );
    }

    if (!track) {
      return NextResponse.json(
        { success: false, error: 'user track is missing' },
        { status: 400 }
      );
    }


    // 1. Get Task Count and Previous Performance
    const dbClient = supabaseAdmin || supabase;

    // Get task count for task_number
    const { count } = await dbClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user', user_id);

    const taskNumber = (count || 0) + 1;

    // Get previous task performance
    let previousPerformance = "N/A";

    // Find the last completed task
    const { data: lastTask } = await dbClient
      .from('tasks')
      .select('id')
      .eq('user', user_id)
      .eq('completed', true)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (lastTask) {
      // Get the last assistant message (feedback) for this task
      const { data: lastMsg } = await dbClient
        .from('chat_history')
        .select('content')
        .eq('task_id', lastTask.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastMsg) {
        previousPerformance = lastMsg.content;
      }
    }

    // 2. Call Python Backend for Task Generation
    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://127.0.0.1:8001';

    const backendResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        user_name: user_name,
        track,
        experience_level: difficulty,
        task_number,
        user_city,
        include_ethical_trap,
        model,
        include_video_brief
      })
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const responseData = await backendResponse.json();
    console.log("AI Response Data:", JSON.stringify(responseData, null, 2));

    let generatedTasks: any[] = [];

    if (responseData && Array.isArray(responseData.tasks)) {
      generatedTasks = responseData.tasks;
    } else {
      console.warn("Unexpected response structure, trying fallback parsing");
      // ... (keep fallback logic if needed, or simplify)
      generatedTasks = Array.isArray(responseData) ? responseData : [responseData];
    }

    // Prepare tasks with user_id and new schema fields
    const tasksToInsert = generatedTasks.map((task: any, index: number) => ({
      user: user_id,
      title: task.title,
      brief_content: task.brief_content || task.description, // Handle potential naming diff
      difficulty: task.difficulty,
      task_track: track,
      ai_persona_config: task.ai_persona_config || DEFAULT_AI_PERSONA_CONFIG,
      completed: false,
      task_number: taskNumber + index,
      resources: task.educational_resources || [] // Save generated resources
    }));
    // Use admin client to bypass RLS, or fall back to regular client
    // dbClient is already defined above

    // Insert tasks into the database
    const { data, error } = await dbClient
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Error inserting tasks:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} tasks generated successfully`,
      tasks: data
    });
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
