import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface TaskDefinition {
  title: string;
  brief_content: string;
  difficulty: string;
  educational_resources: string,
  ai_persona_config?: {
    role: string;
    tone: string;
    expertise: string;
    instruction: string;
    deadline_display: string;
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
      deadline_display,
      experience_level,
      difficulty,
      task_number,
      user_city,
      include_ethical_trap,
      model,
      include_video_brief } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'User ID is missing' }, { status: 400 });
    }

    if (!track) {
      return NextResponse.json({ success: false, error: 'user track is missing' }, { status: 400 });
    }

    const DEFAULT_AI_PERSONA_CONFIG = {
       "role": "Supervisor",
       "tone": "professional",
       "expertise": track,
       "instruction": "Review submission thoroughly",
       "deadline_display": deadline_display
    };

    const dbClient = supabaseAdmin || supabase;

    const { count } = await dbClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user', user_id);

    const taskNumber = (count || 0) + 1;

    let previousPerformance = "N/A";
    const { data: lastTask } = await dbClient
      .from('tasks')
      .select('id')
      .eq('user', user_id)
      .eq('completed', true)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (lastTask) {
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

    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://127.0.0.1:8001';

    const backendResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id, user_name, track, deadline_display, experience_level, difficulty, task_number, user_city, include_ethical_trap, model, include_video_brief
      })
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const responseData = await backendResponse.json();
    let generatedTasks: any[] = [];

    if (responseData && Array.isArray(responseData.tasks)) {
      generatedTasks = responseData.tasks;
    } else {
      generatedTasks = Array.isArray(responseData) ? responseData : [responseData];
    }

    // ==========================================
    // FETCH RELEVANT CACHED VIDEOS ONLY
    // ==========================================
    const trackKeyword = track.split(' ')[0]; 
    
    const { data: cacheData } = await dbClient
      .from('search_cache')
      .select('results')
      .ilike('query', `%${trackKeyword}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let preloadedVideos: any[] = [];
    if (cacheData && Array.isArray(cacheData.results)) {
      preloadedVideos = cacheData.results.map((res: any, index: number) => {
        const link = res.link || res.url;
        return {
          id: `cache-vid-${Date.now()}-${index}`,
          title: res.title || `Video Guide ${index + 1}`,
          type: link && (link.includes("youtube") || link.includes("youtu.be")) ? "video" : "web",
          category: "Video Resources",
          description: res.snippet || "Reference video material for your task.",
          url: link
        };
      }).filter((vid: any) => vid.url); 
    }
    // ==========================================

    const tasksToInsert = [];

    for (let index = 0; index < generatedTasks.length; index++) {
      const task = generatedTasks[index];
      let resourceArray: any[] = [];

      // 1. EXTERNAL EDUCATIONAL LINKS (From Python AI)
      if (typeof task.educational_resources === 'string') {
        const links = task.educational_resources.split(",");
        links.forEach((rawLink: string, i: number) => {
          const cleanLink = rawLink.trim();
          if (cleanLink) {
            resourceArray.push({
              id: `res-${index}-${i}`,
              title: `Learning Resource ${i + 1}`,
              type: cleanLink.includes("youtube") ? "video" : (cleanLink.toLowerCase().endsWith(".pdf") ? "pdf" : "web"),
              category: cleanLink.includes("youtube") ? "Video Resources" : "Reference Links",
              description: cleanLink.includes("youtube") ? "Video tutorial supporting this task" : "Helpful article or PDF for completing this task",
              url: cleanLink,
            });
          }
        });
      }

      // 2. INJECT RELEVANT PRELOADED VIDEOS (From Cache)
      resourceArray = [...resourceArray, ...preloadedVideos];

      // 3. INSERT TASK
      tasksToInsert.push({
        user: user_id,
        title: task.title,
        brief_content: task.brief_content,
        difficulty: task.difficulty,
        task_track: track,
        ai_persona_config: task.ai_persona_config || DEFAULT_AI_PERSONA_CONFIG,
        completed: false,
        task_number: taskNumber + index,
        resources: resourceArray,
        video_brief: task.video_brief
      });
    }

    const { data, error } = await dbClient
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Error inserting tasks:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${data.length} tasks generated successfully`, tasks: data });

  } catch (error: any) {
    console.error('Error generating tasks:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}