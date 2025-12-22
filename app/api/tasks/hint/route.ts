import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { taskTitle, taskContent, userContext, userId, taskId } = await request.json();

    if (!taskTitle || !taskContent || !userId || !taskId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Call Python Backend for Hint
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    const backendResponse = await fetch(`${BACKEND_URL}/get-hint`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            taskId,
            taskTitle,
            taskContent,
            userContext
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const data = await backendResponse.json();
    const hint = data.hint;

    // 2. Save the Hint as a message in the chat history
    const { error: chatError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        task_id: taskId,
        role: 'assistant',
        content: hint
      });

    if (chatError) {
      console.error("Error saving chat message:", chatError);
    }

    return NextResponse.json({ 
      success: true, 
      hint: hint 
    });

  } catch (error: any) {
    console.error("Hint API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
