import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { taskId, userId, user_id, fileUrl, fileName, taskTitle, taskContent, chatHistory, userLevel } = await request.json();

    // Standardize the user ID since both might be passed
    const activeUserId = userId || user_id;

    if (!taskId || !activeUserId || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ==========================================
    // 1. SECURE 3-STRIKE RATE LIMITING
    // ==========================================
    const today = new Date().toISOString().split('T')[0];

    const { data: attemptData } = await supabaseAdmin
      .from('task_attempts')
      .select('attempt_count')
      .eq('user_id', activeUserId)
      .eq('task_id', taskId)
      .eq('attempt_date', today)
      .single();

    const currentAttempts = attemptData?.attempt_count || 0;

    if (currentAttempts >= 3) {
      return NextResponse.json({
        success: false,
        completed: false,
        error: "Limit Reached",
        message: "You have exhausted your 3 submission attempts for today. Review my final evaluation carefully, study the assigned learning materials, and try again tomorrow. Your limit will reset at midnight."
      }, { status: 429 });
    }

    const nextAttempt = currentAttempts + 1;

    // Log the new attempt securely via Admin bypassing RLS
    await supabaseAdmin
      .from('task_attempts')
      .upsert({
        user_id: activeUserId,
        task_id: taskId,
        attempt_date: today,
        attempt_count: nextAttempt
      }, { onConflict: 'user_id, task_id, attempt_date' });
    // ==========================================

    // 2. Call Python Backend for Analysis
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'; 
    
    const backendResponse = await fetch(`${BACKEND_URL}/analyze-submission`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            taskId,
            userId: activeUserId,
            user_id: activeUserId,
            fileUrl,
            fileName,
            taskTitle,
            taskContent,
            chatHistory,
            attempt_number: nextAttempt // Let the AI know which strike they are on
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const data = await backendResponse.json();
    const aiResponse = data.reply || data.feedback; // Support both naming conventions
    const isCompleted = data.completed || data.passed || false;
    const technicalAccuracy = data.technical_accuracy || data.score || 50;

    // 3. Save the AI response as a message in the chat history
    const { error: chatError } = await supabase
      .from('chat_history')
      .insert({
        user_id: activeUserId,
        task_id: taskId,
        role: 'assistant',
        content: aiResponse
      });

    if (chatError) {
      console.error("Error saving chat message:", chatError);
    }

    // 4. If task is completed, process the promotion and stats
    if (isCompleted) {
        const { error: submissionError } = await supabase
            .from('submissions')
            .insert({
                user_id: activeUserId,
                task_id: taskId,
                file_url: fileUrl,
                ai_feedback: aiResponse,
            });
        if (submissionError) console.error("Error saving submission:", submissionError);

        const { error: updateError } = await supabase
            .from('tasks')
            .update({ completed: true })
            .eq('id', taskId);
            
        if (updateError) console.error("Error updating task completion:", updateError);

        // ==========================================
        // SECURE USER SCORE UPDATE (Admin Only)
        // ==========================================
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('tasks_completed, average_score')
            .eq('auth_id', activeUserId)
            .single();

        const currentTasks = userData?.tasks_completed || 0;
        const currentAvg = userData?.average_score || 0;
        const newAvgScore = ((currentAvg * currentTasks) + technicalAccuracy) / (currentTasks + 1);

        await supabaseAdmin.from('users').update({
            tasks_completed: currentTasks + 1,
            average_score: Math.round(newAvgScore)
        }).eq('auth_id', activeUserId);

        // Save performance metrics for charts if AI provided them
        if (data.technical_accuracy !== undefined) {
            await supabaseAdmin.from('performance_reports').insert({
                user_id: activeUserId,
                technical_accuracy: data.technical_accuracy,
                reliability_speed: data.reliability_speed || 0,
                communication_score: data.communication_score || 0,
                current_level: userLevel || 'Level 1',
                assessment_date: new Date().toISOString()
            });
        }
        // ==========================================

        // 5. Auto-Generate Next Task (Your existing logic perfectly preserved)
        const { count: incompleteCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user', activeUserId)
            .eq('completed', false);
        
        if (incompleteCount === 0) {
            console.log("All tasks completed. Generating next task...");
            
            const { data: currentTask } = await supabase
                .from('tasks')
                .select('task_track, difficulty')
                .eq('id', taskId)
                .single();
                
            if (currentTask) {
                const track = currentTask.task_track;
                const experienceLevel = currentTask.difficulty;
                
                const { count: totalCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user', activeUserId);
                
                const nextTaskNumber = (totalCount || 0) + 1;
                
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
                                user: activeUserId,
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

    return NextResponse.json({ 
      success: true, 
      message: aiResponse,
      completed: isCompleted,
      nextAttempt // Pass this back to the frontend UI
    });

  } catch (error: any) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}