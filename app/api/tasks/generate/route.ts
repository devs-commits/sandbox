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
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, track, experienceLevel } = body;
    console.log("Generating tasks for user:", userId, "track:", track, "experienceLevel:", experienceLevel);

    if (!userId || !track) {
      return NextResponse.json(
        { success: false, error: 'User ID and track are required' },
        { status: 400 }
      );
    }

    // 1. Call Python Backend for Task Generation
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const backendResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track,
            experience_level: experienceLevel
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const responseData = await backendResponse.json();
    let generatedTasks: any[] = [];

    if (Array.isArray(responseData)) {
        generatedTasks = responseData;
    } else if (responseData && typeof responseData === 'object') {
        // Handle case where response is an object (e.g. { tasks: [...] })
        if (Array.isArray(responseData.tasks)) {
            generatedTasks = responseData.tasks;
        } else {
            // Try to find any array property if 'tasks' key is missing
            const arrayVal = Object.values(responseData).find(v => Array.isArray(v));
            if (arrayVal) {
                generatedTasks = arrayVal as any[];
            } else {
                throw new Error("Invalid response format from AI: received object but could not find tasks array");
            }
        }
    } else {
        throw new Error("Invalid response format from AI");
    }

    // Prepare tasks with user_id and new schema fields
    const tasksToInsert = generatedTasks.map((task: any) => ({
      user: userId,
      title: task.title,
      brief_content: task.brief_content || task.description, // Handle potential naming diff
      difficulty: task.difficulty || experienceLevel,
      task_track: track,
      ai_persona_config: task.ai_persona_config || DEFAULT_AI_PERSONA_CONFIG,
      completed: false
    }));
    // Use admin client to bypass RLS, or fall back to regular client
    const dbClient = supabaseAdmin || supabase;

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
