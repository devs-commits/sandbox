import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
    // console.log("Generating tasks for user:", user_id, "track:", track, "user_city:", user_city);

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


// Default AI persona configuration
const DEFAULT_AI_PERSONA_CONFIG = {
   "role": "Supervisor",
            "tone": "professional",
            "expertise": track,
            "instruction": "Review submission thoroughly",
            "deadline_display": deadline_display
};

    // 1. Get Task Count and Previous Performance
    const dbClient = supabaseAdmin || supabase;
    const storageClient = supabaseAdmin ?? supabase;

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
        deadline_display,
        experience_level,
        difficulty,
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
    // console.log("FULL BACKEND RESPONSE:", responseData);
    // console.log("AI Response Data:", JSON.stringify(responseData, null, 2));

    let generatedTasks: any[] = [];

    if (responseData && Array.isArray(responseData.tasks)) {
      generatedTasks = responseData.tasks;
    } else {
      console.warn("Unexpected response structure, trying fallback parsing");
      // ... (keep fallback logic if needed, or simplify)
      generatedTasks = Array.isArray(responseData) ? responseData : [responseData];
    }

const tasksToInsert = [];

for (let index = 0; index < generatedTasks.length; index++) {
  const task = generatedTasks[index];

  let resourceArray: any[] = [];

  // ========================
  // 1️⃣ GENERATE PDF
  // ========================

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { height } = page.getSize();
  let y = height - 60;

  page.drawText("WDC Labs", { x: 50, y, size: 18, font: fontBold });

  y -= 30;

  page.drawText(task.title, { x: 50, y, size: 14, font: fontBold });

  y -= 30;

  page.drawText(task.brief_content, {
    x: 50,
    y,
    size: 11,
    font,
    maxWidth: 495,
    lineHeight: 15,
  });

  const pdfBytes = await pdfDoc.save();

  const safeTitle = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${user_id}/${safeTitle}.pdf`;

  const storageClient = supabaseAdmin ?? supabase;
  const { error: uploadError } = await storageClient.storage
    .from('archives')
    .upload(fileName, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (!uploadError) {
    const { data: publicUrl } = storageClient.storage
      .from('archives')
      .getPublicUrl(fileName);

    resourceArray.push({
      id: `pdf-${index}`,
      title: task.title,
      type: "pdf",
      category: "Task Guide",
      description: "Official assignment brief document",
      url: publicUrl.publicUrl,
    });
  }

  // ========================
  // 2️⃣ EDUCATIONAL LINKS
  // ========================

  if (typeof task.educational_resources === 'string') {
    const links = task.educational_resources.split(",");

    links.forEach((rawLink: string, i: number) => {
      const cleanLink = rawLink.trim();

      resourceArray.push({
        id: `res-${index}-${i}`,
        title: `Learning Resource ${i + 1}`,
        type: cleanLink.includes("youtube") ? "video" : "web",
        category: cleanLink.includes("youtube")
          ? "Video Resources"
          : "Reference Links",
        description: cleanLink.includes("youtube")
          ? "Video tutorial supporting this task"
          : "Helpful article for completing this task",
        url: cleanLink,
      });
    });
  }

  // ========================
  // 3️⃣ INSERT TASK
  // ========================

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
    // Use admin client to bypass RLS, or fall back to regular client
    // dbClient is already defined above

    // Insert tasks into the database
    const { data, error } = await dbClient
      .from('tasks')
      .insert(tasksToInsert)
      .select();

  //  console.log("INSERTED TASK DATA:", data);
  

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
