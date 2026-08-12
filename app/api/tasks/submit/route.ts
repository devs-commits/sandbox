import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logTaskActivityForAuthUser } from '@/lib/task-activity';

export async function POST(request: Request) {
  let activeUserId: string | null = null;
  let activeTaskId: string | number | null = null;
  let submissionAttemptNumber: number | null = null;
  let submissionStarted = false;

  try {
    const body = await request.json();
    
    // Extract exact keys matching OfficeContext.tsx 
    const { 
        task_id, 
        user_id, 
        file_url, 
        file_content, 
        task_title, 
        task_brief, 
        chat_history, 
        userLevel,
        attempt_number,
        
        // Fallbacks for older frontend versions
        taskId,
        userId,
        fileUrl,
        taskContent,
        taskTitle,
        taskBrief,
        chatHistory
    } = body;

    activeUserId = user_id || userId;
    activeTaskId = task_id || taskId;
// THE FIX: Fallback to null instead of "" for strict Python validation
    const finalFileUrl = file_url || fileUrl || null;
    const finalFileContent = file_content || taskContent || "";
    const finalTaskTitle = task_title || taskTitle || "Task Submission";
    const finalTaskBrief = task_brief || taskBrief || "";
    const finalChatHistory = chat_history || chatHistory || [];

    if (!activeTaskId || !activeUserId) {
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
      .eq('task_id', activeTaskId)
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
    submissionAttemptNumber = nextAttempt;

    await supabaseAdmin
      .from('task_attempts')
      .upsert({
        user_id: activeUserId,
        task_id: activeTaskId,
        attempt_date: today,
        attempt_count: nextAttempt
      }, { onConflict: 'user_id, task_id, attempt_date' });

    // From here, an error is a technical submission failure rather than a
    // validation response or an invalid assignment.
    submissionStarted = true;

    // ==========================================
    // 2. Call Python Backend for Analysis
    // ==========================================
    const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com'; 
    
    const backendResponse = await fetch(`${BACKEND_URL}/review-submission`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: activeUserId,
            task_id: activeTaskId,
            file_url: finalFileUrl,
            file_content: finalFileContent,
            task_title: finalTaskTitle,
            task_brief: finalTaskBrief,
            chat_history: finalChatHistory,
            attempt_number: nextAttempt 
        })
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("Submission error text:", errorText);
        throw new Error(`Backend API Error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    const aiResponse = data.feedback || "Review completed."; 
    const isPassed = data.passed || false;
    const technicalAccuracy = data.score ?? 50;

    // Save Sola's feedback to chat history
    await supabase.from('chat_history').insert({
        user_id: activeUserId,
        task_id: activeTaskId,
        role: 'assistant',
        content: aiResponse
    });

    // ==========================================
    // 3. 🔥 THE FIX: Update Tasks Table Directly
    // ==========================================
    // We update the task directly so the frontend ArchivesView can pull it immediately.
    await supabaseAdmin
        .from('tasks')
        .update({ 
            status: isPassed ? 'passed' : 'needs_revision',
            completed: isPassed,
            file_url: finalFileUrl, // Store artifact link for the portfolio
            score: technicalAccuracy,
            feedback: aiResponse
        })
        .eq('id', activeTaskId);

    if (isPassed) {
        // Get user ID from users table
        const { data: dbUser, error: userLookupError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('auth_id', activeUserId)
            .single();

        if (!dbUser) {
            throw new Error(`User not found for auth_id: ${activeUserId}`);
        }

        // Save historical log in submissions table (Removed the Number() cast to prevent UUID breaks)
        await supabaseAdmin
            .from('submissions')
            .insert({
                user_id: dbUser.id,
                task_id: activeTaskId, 
                file_url: finalFileUrl,
                ai_feedback: aiResponse,
            });

        // Get current user stats
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('tasks_completed, average_score')
            .eq('auth_id', activeUserId)
            .maybeSingle();

        const currentTasks = userData?.tasks_completed || 0;
        const currentAvg = userData?.average_score || 0;

        const newAvgScore =
            ((currentAvg * currentTasks) + technicalAccuracy) /
            (currentTasks + 1);

        // Update overall user stats
        await supabaseAdmin
            .from('users')
            .update({
                tasks_completed: currentTasks + 1,
                average_score: Math.round(newAvgScore),
            })
            .eq('auth_id', activeUserId);

        // Save performance report
        if (technicalAccuracy !== undefined) {
            await supabaseAdmin
                .from('performance_reports')
                .insert({
                    user_id: dbUser.id,
                    technical_accuracy: technicalAccuracy,
                    reliability_speed: data.reliability_speed || 0,
                    communication_score: data.communication_score || 0,
                    current_level: userLevel || 'Level 1',
                    assessment_date: new Date().toISOString(),
                });
        }
        
        // 🚨 AUTO-GENERATE TASK FETCH REMOVED HERE TO PREVENT WEEK 2 LEAKING!
    }

    // A failing grade still means the backend successfully received and
    // evaluated this submission, so it receives both success audit events.
    await logTaskActivityForAuthUser({
      authUserId: activeUserId,
      taskId: activeTaskId,
      eventType: 'task_submitted',
      attemptNumber: nextAttempt,
      status: 'success',
    });
    await logTaskActivityForAuthUser({
      authUserId: activeUserId,
      taskId: activeTaskId,
      eventType: 'task_graded',
      attemptNumber: nextAttempt,
      status: 'success',
      score: technicalAccuracy,
    });

    return NextResponse.json({ 
      success: true, 
      message: aiResponse,
      completed: isPassed,
      passed: isPassed,
      technical_accuracy: technicalAccuracy,
      portfolio_bullet: data.portfolio_bullet
    });

  } catch (error: any) {
    console.error("Submission API Error:", error);

    if (submissionStarted && activeUserId && activeTaskId) {
      await logTaskActivityForAuthUser({
        authUserId: activeUserId,
        taskId: activeTaskId,
        eventType: 'task_submission_failed',
        attemptNumber: submissionAttemptNumber,
        status: 'failed',
      });
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
