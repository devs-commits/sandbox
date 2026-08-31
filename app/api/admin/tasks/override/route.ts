import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to resolve IP address to a physical location
async function resolveLocation(ip: string): Promise<string> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local Development (Lagos, NG)';
  }

  try {
    // Clean up proxy IP chains if multiple IPs are passed in x-forwarded-for
    const cleanIp = ip.split(',')[0].trim();
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,country`);
    const data = await res.json();

    if (data && data.status === 'success') {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
  } catch (err) {
    console.error('Location lookup failed:', err);
  }

  return 'Unknown Location';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { targetUserId, targetWeek, reason } = body;

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !requestingUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminLookupError } = await supabaseAdmin
      .from('users')
      .select('auth_id, role')
      .eq('auth_id', requestingUser.id)
      .maybeSingle();

    if (adminLookupError || adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const numTargetWeek = Number(targetWeek);
    if (!targetUserId || !Number.isInteger(numTargetWeek) || numTargetWeek < 1 || numTargetWeek > 24) {
      return NextResponse.json({ error: 'A target student and a week from 1 to 24 are required' }, { status: 400 });
    }

    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('auth_id, full_name, track, role')
      .eq('auth_id', targetUserId)
      .maybeSingle();

    if (targetUserError || !targetUser || targetUser.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser';
    const location = await resolveLocation(rawIp);

    const track = targetUser.track || 'general';
    const fullName = targetUser.full_name || 'Intern';
    const safeAdminId = adminUser.auth_id;

    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, status, completed, task_number, week, title')
      .eq('user', targetUserId);

    const { data: oldProgression, error: oldProgressionError } = await supabaseAdmin
      .from('user_progression')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (oldProgressionError) throw oldProgressionError;

    const targetWeekTasks = allTasks?.filter(t => {
      const matchNum = Number(t.task_number) === numTargetWeek || Number(t.week) === numTargetWeek;
      const matchTitle = t.title && t.title.toLowerCase().includes(`week ${numTargetWeek}`);
      return matchNum || matchTitle;
    }) || [];
    
    const targetWeekTaskIds = targetWeekTasks.map(t => t.id);

    const blockingTasks = allTasks?.filter(t => 
      t.completed === false || !['approved', 'passed'].includes(t.status)
    ) || [];

    if (blockingTasks.length > 0) {
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'approved', completed: true }) 
        .in('id', blockingTasks.map(t => t.id));
    }

    const { error: preparingProgressionError } = await supabaseAdmin
      .from('user_progression')
      .upsert({ user_id: targetUserId, week_status: 'pending', current_week: numTargetWeek }, { onConflict: 'user_id' });

    if (preparingProgressionError) throw preparingProgressionError;

    // 4. CALL THE AI ENGINE (With synchronized unified Friday deadline)
    const now = new Date();
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    const fridayDate = new Date(now);
    fridayDate.setDate(now.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    const formattedDeadline = `Friday, ${fridayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at 11:59 PM`;

    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';
    const pythonResponse = await fetch(`${AI_BACKEND_URL}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: targetUserId, 
        user_name: fullName,
        track: track, 
        task_number: numTargetWeek,
        deadline_display: formattedDeadline,
        is_admin_override: true 
      })
    });

    const responseText = await pythonResponse.text();
    let parsedData: any = {};
    try { parsedData = JSON.parse(responseText); } catch (e) {}

    if (!pythonResponse.ok || parsedData.success === false || parsedData.error) {
      const errorMessage = parsedData.detail || parsedData.error || responseText || "AI Engine failed to generate task";
      
      for (const task of blockingTasks) {
        await supabaseAdmin.from('tasks').update({ status: task.status, completed: task.completed }).eq('id', task.id);
      }
      
      if (oldProgression) {
        await supabaseAdmin.from('user_progression').update({ 
          current_week: oldProgression.current_week, week_status: oldProgression.week_status 
        }).eq('user_id', targetUserId);
      } else {
        await supabaseAdmin.from('user_progression').delete().eq('user_id', targetUserId);
      }

      await supabaseAdmin.from('task_generation_logs').insert({
        target_user_id: targetUserId, admin_id: safeAdminId, trigger_source: 'admin_override', assigned_week: numTargetWeek, status: 'FAILED',
        details: `Backend rejected: ${errorMessage} | Reason: ${reason} | Location: ${location} | Browser: ${userAgent}`
      });

      return NextResponse.json({ success: false, error: errorMessage }, { status: pythonResponse.ok ? 400 : pythonResponse.status });
    }

    const tasksToRestore = blockingTasks.filter(bt => !targetWeekTaskIds.includes(bt.id));
    for (const task of tasksToRestore) {
      await supabaseAdmin.from('tasks').update({ status: task.status, completed: task.completed }).eq('id', task.id);
    }

    if (targetWeekTaskIds.length > 0) {
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'archived_by_admin', completed: true })
        .in('id', targetWeekTaskIds);
    }

    const { error: finalProgressionError } = await supabaseAdmin
      .from('user_progression')
      .upsert({ user_id: targetUserId, week_status: 'in_progress', current_week: numTargetWeek }, { onConflict: 'user_id' });

    if (finalProgressionError) throw finalProgressionError;

    // The Office treats this column as the source of truth for first-task
    // behaviour. Only a successful Week 1 admin assignment changes it.
    if (numTargetWeek === 1) {
      const { error: firstTaskStateError } = await supabaseAdmin
        .from('users')
        .update({ is_first_task: false })
        .eq('auth_id', targetUserId);

      if (firstTaskStateError) throw firstTaskStateError;
    }

    await supabaseAdmin.from('task_generation_logs').insert({
      target_user_id: targetUserId, admin_id: safeAdminId, trigger_source: 'admin_override', assigned_week: numTargetWeek, status: 'SUCCESS',
      details: `Admin Override: ${reason} | Location: ${location} | Browser: ${userAgent}`
    });

    return NextResponse.json({ success: true, message: `Week ${numTargetWeek} assigned successfully.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
