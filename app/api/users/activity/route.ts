import { NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Records a successful student session. This is intentionally separate from
// subscription state so admin engagement reporting remains subscription-neutral.
export async function POST(request: Request) {
  try {
    const supabaseServer = createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        last_active_at: now.toISOString(),
        last_activity_date: now.toISOString().slice(0, 10),
      })
      .eq('auth_id', user.id)
      .eq('role', 'student');

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unable to record user activity:', error);
    return NextResponse.json({ success: false, error: 'Unable to record user activity' }, { status: 500 });
  }
}
