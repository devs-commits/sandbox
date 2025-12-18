import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { taskId, userId, fileUrl, fileName } = await request.json();

    if (!taskId || !userId || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Log the submission in the database (optional but good practice)
    // We might want to store this in a 'submissions' table if it exists
    // For now, we'll just proceed to the "AI Analysis"

    console.log(`Processing submission for Task ${taskId} by User ${userId}. File: ${fileName}`);

    // 2. Mock Gemini/LLM Analysis
    // In a real scenario, you would:
    // - Download the file content or pass the URL to the LLM
    // - Send the task description + file content to the LLM
    // - Get the critique/feedback
    
    // Simulating AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockAiResponse = `
**Analysis of ${fileName}**

I've reviewed your submission for this task. Here is my feedback:

1.  **Structure**: The file structure looks correct and follows the standard conventions.
2.  **Content**: You've addressed the main points of the brief. Good job on the implementation details.
3.  **Improvements**: 
    *   Consider adding more comments to explain complex logic.
    *   There are a few edge cases that might need handling.

Overall, this is a solid submission! You're making great progress.
    `;

    // 3. Save the AI response as a message in the chat history
    const { error: chatError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        task_id: taskId,
        role: 'assistant',
        content: mockAiResponse
      });

    if (chatError) {
      console.error("Error saving chat message:", chatError);
      // We continue anyway to return the response to the UI
    }

    // 4. Mark task as completed (optional, depending on logic)
    // await supabase.from('tasks').update({ completed: true }).eq('id', taskId);

    return NextResponse.json({ 
      success: true, 
      message: mockAiResponse 
    });

  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
