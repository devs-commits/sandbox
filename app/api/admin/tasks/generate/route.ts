import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to resolve IP address to a physical location with timeout fallback
async function resolveLocation(ip: string): Promise<string> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local Development (Lagos, NG)';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const cleanIp = ip.split(',')[0].trim();
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,country`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    if (data && data.status === 'success') {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Location lookup failed or timed out:', err);
  }

  return 'Unknown Location';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetUserId, adminId, targetWeek, track, fullName, reason } = body;

    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser';

    const locationName = await resolveLocation(rawIp);

    if (!targetUserId || !track || !targetWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize UUID string format for DB log insertion
    let safeAdminId = null;
    if (adminId && adminId.length === 36) safeAdminId = adminId;

    // 1. STASH STATE: Fetch existing tasks using 'task_number'
    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, status, completed, task_number, title')
      .eq('user', targetUserId);

    const { data: oldProgression } = await supabaseAdmin
      .from('user_progression')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const numTargetWeek = Number(targetWeek);
    
    // Identify existing target week tasks for archival
    const targetWeekTasks = allTasks?.filter(t => {
      const matchNum = Number(t.task_number) === numTargetWeek;
      const matchTitle = t.title && t.title.toLowerCase().includes(`week ${numTargetWeek}`);
      return matchNum || matchTitle;
    }) || [];
    
    const targetWeekTaskIds = targetWeekTasks.map(t => t.id);

    // Identify incomplete tasks blocking the AI engine
    const blockingTasks = allTasks?.filter(t => 
      t.completed === false || !['approved', 'passed'].includes(t.status)
    ) || [];

    // 2. PHANTOM APPROVAL: Temporarily clear active tasks
    if (blockingTasks.length > 0) {
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'approved', completed: true }) 
        .in('id', blockingTasks.map(t => t.id));
    }

    // 3. TIME-LOCK BYPASS: Unlock Monday restriction
    await supabaseAdmin
      .from('user_progression')
      .update({ week_status: 'pending', current_week: numTargetWeek })
      .eq('user_id', targetUserId);

    // 4. CALL THE AI ENGINE
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';
    const pythonResponse = await fetch(`${AI_BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: targetUserId, 
        user_name: fullName || "Intern", 
        track: track, 
        task_number: numTargetWeek, 
        is_admin_override: true 
      })
    });

    const responseText = await pythonResponse.text();
    let parsedData: any = {};
    try { parsedData = JSON.parse(responseText); } catch (e) {}

    // 5. ROLLBACK ON FAILURE: Revert changes if AI rejects generation
    if (!pythonResponse.ok || parsedData.success === false || parsedData.error) {
      const errorMessage = parsedData.detail || parsedData.error || responseText || "AI Engine failed to generate task";
      
      for (const task of blockingTasks) {
        await supabaseAdmin.from('tasks').update({ status: task.status, completed: task.completed }).eq('id', task.id);
      }
      
      if (oldProgression) {
        await supabaseAdmin.from('user_progression').update({ 
          current_week: oldProgression.current_week, 
          week_status: oldProgression.week_status 
        }).eq('user_id', targetUserId);
      }

      await supabaseAdmin.from('task_generation_logs').insert({
        target_user_id: targetUserId, 
        admin_id: safeAdminId, 
        trigger_source: 'admin_override', 
        assigned_week: numTargetWeek, 
        status: 'FAILED',
        details: `Backend rejected: ${errorMessage} | Reason: ${reason} | Location: ${locationName} | Browser: ${userAgent}`
      });

      return NextResponse.json({ success: false, error: errorMessage }, { status: pythonResponse.ok ? 400 : pythonResponse.status });
    }

    // 6. SUCCESS: SECURE THE DESK
    // Restore non-target blocking tasks
    const tasksToRestore = blockingTasks.filter(bt => !targetWeekTaskIds.includes(bt.id));
    for (const task of tasksToRestore) {
      await supabaseAdmin.from('tasks').update({ status: task.status, completed: task.completed }).eq('id', task.id);
    }

    // Archive old target week tasks to eliminate duplicates
    if (targetWeekTaskIds.length > 0) {
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'archived_by_admin', completed: true })
        .in('id', targetWeekTaskIds);
    }

    // Lock progression state to newly assigned week
    await supabaseAdmin
      .from('user_progression')
      .update({ week_status: 'in_progress', current_week: numTargetWeek })
      .eq('user_id', targetUserId);

    // Record audit log
    await supabaseAdmin.from('task_generation_logs').insert({
      target_user_id: targetUserId, 
      admin_id: safeAdminId, 
      trigger_source: 'admin_override', 
      assigned_week: numTargetWeek, 
      status: 'SUCCESS',
      details: `Admin Override: ${reason} | Location: ${locationName} | Browser: ${userAgent}`
    });

    // 7. CLEANUP DATE PLACEHOLDERS WITH WILDCARD REGEX
    try {
      const { data: latestTask } = await supabaseAdmin
        .from('tasks')
        .select('id, brief_content, description, created_at')
        .eq('user', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestTask) {
        const baseDate = latestTask.created_at ? new Date(latestTask.created_at) : new Date();
        const currentDateStr = baseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const deadlineDateStr = `${new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at 11:59 PM`;

        const sanitize = (text: string) => {
          if (!text) return text;
          return text
            .replace(/\[[^\]]*deadline[^\]]*\]/gi, deadlineDateStr)
            .replace(/\[[^\]]*date[^\]]*\]/gi, currentDateStr);
        };

        const fixedBrief = sanitize(latestTask.brief_content || '');
        const fixedDesc = sanitize(latestTask.description || '');

        if (fixedBrief !== latestTask.brief_content || fixedDesc !== latestTask.description) {
          await supabaseAdmin.from('tasks').update({ brief_content: fixedBrief, description: fixedDesc }).eq('id', latestTask.id);
        }
      }
    } catch (cleanupError) {
      console.error('Date placeholder cleanup error:', cleanupError);
    }

    return NextResponse.json({ success: true, message: `Week ${numTargetWeek} assigned successfully.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}