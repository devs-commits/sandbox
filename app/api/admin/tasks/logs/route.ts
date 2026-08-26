import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch the raw logs directly
    const { data: rawLogs, error: logsError } = await supabaseAdmin
      .from('task_generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error("Supabase Logs Fetch Error:", logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    if (!rawLogs || rawLogs.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    // 2. Extract unique user IDs from the logs
    const uniqueUserIds = [...new Set(rawLogs.map(log => log.target_user_id))];

    // 3. Manually fetch the names of those users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('auth_id, full_name, email')
      .in('auth_id', uniqueUserIds);

    // 4. Manually map the data together so the frontend gets exactly what it expects
    const enrichedLogs = rawLogs.map(log => {
      const matchedUser = users?.find(u => u.auth_id === log.target_user_id);
      return {
        ...log,
        users: matchedUser ? { full_name: matchedUser.full_name, email: matchedUser.email } : null
      };
    });

    return NextResponse.json({ logs: enrichedLogs });

  } catch (error: any) {
    console.error('Audit Logs Crash:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}