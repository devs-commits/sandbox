import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { taskId, userId, fileUrl, fileName, taskTitle, taskContent, chatHistory } = await request.json();

    if (!taskId || !userId || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Call Python Backend for Analysis
    // Ensure this URL matches your running backend (localhost for dev, Render URL for prod)
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'; 
    
    const backendResponse = await fetch(`${BACKEND_URL}/analyze-submission`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            taskId,
            userId,
            fileUrl,
            fileName,
            taskTitle,
            taskContent,
            chatHistory
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const data = await backendResponse.json();
    const aiResponse = data.reply;
    const isCompleted = data.completed || data.passed || false;

    // 2. Save the AI response as a message in the chat history
    const { error: chatError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        task_id: taskId,
        role: 'assistant',
        content: aiResponse
      });

    if (chatError) {
      console.error("Error saving chat message:", chatError);
      // We continue anyway to return the response to the UI
    }

    // 3. If task is completed, update the task status
    if (isCompleted) {
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ completed: true })
            .eq('id', taskId);
            
        if (updateError) {
            console.error("Error updating task completion:", updateError);
        } else {
            // 4. Check if we need to generate the next task
            // Check if there are any incomplete tasks left
            const { count: incompleteCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user', userId)
                .eq('completed', false);
            
            if (incompleteCount === 0) {
                console.log("All tasks completed. Generating next task...");
                
                // Fetch current task to get track/difficulty context
                const { data: currentTask } = await supabase
                    .from('tasks')
                    .select('task_track, difficulty')
                    .eq('id', taskId)
                    .single();
                    
                if (currentTask) {
                    const track = currentTask.task_track;
                    const experienceLevel = currentTask.difficulty;
                    
                    // Calculate next task number
                    const { count: totalCount } = await supabase
                        .from('tasks')
                        .select('*', { count: 'exact', head: true })
                        .eq('user', userId);
                    
                    const nextTaskNumber = (totalCount || 0) + 1;
                    
                    // Call Python Backend to generate next task
                    try {
                        const generateResponse = await fetch(`${BACKEND_URL}/generate-tasks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                track,
                                experience_level: experienceLevel,
                                task_number: nextTaskNumber,
                                previous_task_performance: aiResponse
                            })
                        });
                        
                        if (generateResponse.ok) {
                            const genData = await generateResponse.json();
                            let newTasks: any[] = [];
                            
                            if (Array.isArray(genData)) newTasks = genData;
                            else if (genData.tasks && Array.isArray(genData.tasks)) newTasks = genData.tasks;
                            else if (genData.title) newTasks = [genData];
                            
                            if (newTasks.length > 0) {
                                const tasksToInsert = newTasks.map((t: any, idx: number) => ({
                                    user: userId,
                                    title: t.title,
                                    brief_content: t.brief_content || t.description,
                                    difficulty: t.difficulty || experienceLevel,
                                    task_track: track,
                                    ai_persona_config: t.ai_persona_config || { role: "Mentor", instruction: "Complete the task." },
                                    completed: false,
                                    task_number: nextTaskNumber + idx
                                }));
                                
                                const dbClient = supabaseAdmin || supabase;
                                await dbClient.from('tasks').insert(tasksToInsert);
                                console.log("Next task generated and inserted.");
                            }
                        } else {
                            console.error("Failed to auto-generate task:", await generateResponse.text());
                        }
                    } catch (genError) {
                        console.error("Error in auto-generation:", genError);
                    }
                }
            }
        }
    }

    return NextResponse.json({ 
      success: true, 
      message: aiResponse,
      completed: isCompleted
    });

  } catch (error: any) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
