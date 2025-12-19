import { NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

// frontend to call this route => this route will call the AI api
type ChatResponse = {
    role: string
    content: string
}

const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000'
}

export async function POST(request: Request) {

  try {
        // create request-scoped client that forwards Authorization header
        const supabase = createSupabaseClientFromRequest(request);
        var greeted_today: boolean
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from('chat_history')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString());

    if (!count){
        greeted_today = false 
    } else {
        greeted_today = true
    }

    // payload structure: message, user_info, chat_history
    const { message, user_info, task_id } = await request.json();
    const { error:insertError } = await supabase.from('chat_history').insert({
        user_id: user_info.user_id, role: "user", content:message, task_id: task_id
    });
    if (insertError) {
        console.log("Error writing Ai response to db: ", insertError)
        throw insertError;
    }

    const { data, error } = await supabase
        .from("chat_history")
        .select("role, content")
        .eq("user_id", user_info.user_id)      
        .order("created_at", { ascending: true }) 
        .limit(10)

    const chat_history = data

    if (error) {
        throw error
    }

    if (!message || !user_info) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const requestBody = JSON.stringify({
            message, user_info, chat_history, greeted_today
        })
    const response = await fetch(`${getBaseUrl()}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody

    });

    const res: ChatResponse  = await response.json()

    const { error: errorInsert } = await supabase.from('chat_history').insert({
        user_id: user_info.user_id, role: "assistant", content: res.content, task_id: task_id
    });
    if (errorInsert) {
        console.log("Error writing Ai response to db: ", errorInsert)
        throw errorInsert;
    }

    return NextResponse.json({
        success: true, 
        response: res
    })
    

//     // 1. Log the submission in the database (optional but good practice)
//     // We might want to store this in a 'submissions' table if it exists
//     // For now, we'll just proceed to the "AI Analysis"

//     console.log(`Processing submission for Task ${task_id} by User ${userId}. File: ${fileName}`);

//     // 2. Mock Gemini/LLM Analysis
//     // In a real scenario, you would:
//     // - Download the file content or pass the URL to the LLM
//     // - Send the task description + file content to the LLM
//     // - Get the critique/feedback
    
//     // Simulating AI processing delay
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     const mockAiResponse = `
// **Analysis of ${fileName}**

// I've reviewed your submission for this task. Here is my feedback:

// 1.  **Structure**: The file structure looks correct and follows the standard conventions.
// 2.  **Content**: You've addressed the main points of the brief. Good job on the implementation details.
// 3.  **Improvements**: 
//     *   Consider adding more comments to explain complex logic.
//     *   There are a few edge cases that might need handling.

// Overall, this is a solid submission! You're making great progress.
//     `;

//     // 3. Save the AI response as a message in the chat history
//     const { error: chatError } = await supabase
//       .from('chat_history')
//       .insert({
//         user_id: userId,
//         task_id: taskId,
//         role: 'assistant',
//         content: mockAiResponse
//       });

//     if (chatError) {
//       console.error("Error saving chat message:", chatError);
//       // We continue anyway to return the response to the UI
//     }

//     // 4. Mark task as completed (optional, depending on logic)
//     // await supabase.from('tasks').update({ completed: true }).eq('id', taskId);

//     return NextResponse.json({ 
//       success: true, 
//       message: mockAiResponse 
//     });

  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
