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
    
    let { targetUserId, adminId, targetWeek, track, fullName, reason } = body;

    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser';
    const location = await resolveLocation(rawIp);

    if (!targetUserId || !targetWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!track || track.trim() === '') {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('track')
        .eq('auth_id', targetUserId)
        .maybeSingle();
        
      track = userData?.track || "general";
    }

    let safeAdminId = null;
    if (adminId && adminId.length === 36) safeAdminId = adminId;

    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, status, completed, task_number, week, title')
      .eq('user', targetUserId);

    const { data: oldProgression } = await supabaseAdmin
      .from('user_progression')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    const numTargetWeek = Number(targetWeek);
    
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

    await supabaseAdmin
      .from('user_progression')
      .update({ week_status: 'pending', current_week: numTargetWeek })
      .eq('user_id', targetUserId);

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
        user_name: fullName || "Intern", 
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

    await supabaseAdmin
      .from('user_progression')
      .update({ week_status: 'in_progress', current_week: numTargetWeek })
      .eq('user_id', targetUserId);

    await supabaseAdmin.from('task_generation_logs').insert({
      target_user_id: targetUserId, admin_id: safeAdminId, trigger_source: 'admin_override', assigned_week: numTargetWeek, status: 'SUCCESS',
      details: `Admin Override: ${reason} | Location: ${location} | Browser: ${userAgent}`
    });

    return NextResponse.json({ success: true, message: `Week ${numTargetWeek} assigned successfully.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}