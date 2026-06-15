import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    // Extracted taskBrief to ensure Sola gets the full context
    const { taskId, userId, user_id, fileUrl, fileName, taskTitle, taskBrief, taskContent, chatHistory, userLevel } = await request.json();

    // Standardize the user ID since both might be passed
    const activeUserId = userId || user_id;

    if (!taskId || !activeUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ==========================================
    // 1. SECURE 3-STRIKE RATE LIMITING
    // ==========================================
    const today = new Date().toISOString().split('T')[0];

    // FIX: Used maybeSingle() so new users don't trigger a 406 crash
    const { data: attemptData } = await supabaseAdmin
      .from('task_attempts')
      .select('attempt_count')
      .eq('user_id', activeUserId)
      .eq('task_id', taskId)
      .eq('attempt_date', today)
      .maybeSingle();

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
    // FIX: Using the correct Environment Variable and Render fallback
    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com'; 
    
    // FIX: Changed to the correct endpoint name: /review-submission
    const backendResponse = await fetch(`${BACKEND_URL}/review-submission`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            file_url: fileUrl || "",
            file_content: taskContent || "",
            task_title: taskTitle || "Task Submission",
            task_brief: taskBrief || "",
            attempt_number: nextAttempt 
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend API Error: ${backendResponse.status} - ${errorText}`);
    }

    const data = await backendResponse.json();
    
    // Support the Python model keys
    const aiResponse = data.feedback || "Review completed."; 
    const isCompleted = data.passed || false;
    const technicalAccuracy = data.score || 50;

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
            .maybeSingle();

        const currentTasks = userData?.tasks_completed || 0;
        const currentAvg = userData?.average_score || 0;
        const newAvgScore = ((currentAvg * currentTasks) + technicalAccuracy) / (currentTasks + 1);

        await supabaseAdmin.from('users').update({
            tasks_completed: currentTasks + 1,
            average_score: Math.round(newAvgScore)
        }).eq('auth_id', activeUserId);

        // Save performance metrics for charts if AI provided them
        if (technicalAccuracy !== undefined) {
            await supabaseAdmin.from('performance_reports').insert({
                user_id: activeUserId,
                technical_accuracy: technicalAccuracy,
                reliability_speed: data.reliability_speed || 0,
                communication_score: data.communication_score || 0,
                current_level: userLevel || 'Level 1',
                assessment_date: new Date().toISOString()
            });
        }
        // ==========================================

        // 5. Auto-Generate Next Task
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
                .maybeSingle();
                
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
                            user_name: "Intern",
                            track: track || "General",
                            experience_level: experienceLevel,
                            task_number: nextTaskNumber,
                            deadline_display: "Friday, 11:59 PM"
                        })
                    });
                    
                    if (generateResponse.ok) {
                        const genData = await generateResponse.json();
                        // Generation succeeds silently in background queue now
                        console.log("Next task requested from queue.");
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
      nextAttempt 
    });

  } catch (error: any) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}