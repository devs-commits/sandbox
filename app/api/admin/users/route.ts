import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'student' or 'recruiter'

  try {
    const supabaseServer = createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (type === 'student') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*, is_first_task')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // A trial is only a trial when the learner has never completed a paid plan.
      // Payment history is the durable source for that distinction; the current
      // subscription_plan alone can be changed by a later renewal or admin edit.
      const students = data || [];
      const studentIds = students.map((student) => student.auth_id).filter(Boolean);
      const studentEmails = students.map((student) => student.email).filter(Boolean);
      const studentRecordIds = students.map((student) => student.id).filter(Boolean);
      const paidPaymentStatus = ['paid', 'success', 'successful', 'confirmed'];
      const activityCutoff = new Date();
      activityCutoff.setDate(activityCutoff.getDate() - 30);
      const [paymentsByUser, paymentsByEmail, recentTaskActivity] = await Promise.all([
        studentIds.length
          ? supabaseAdmin
              .from('payments')
              .select('user_id, email, subscription_plan')
              .in('user_id', studentIds)
              .in('payment_status', paidPaymentStatus)
          : Promise.resolve({ data: [], error: null }),
        studentEmails.length
          ? supabaseAdmin
              .from('payments')
              .select('user_id, email, subscription_plan')
              .in('email', studentEmails)
              .in('payment_status', paidPaymentStatus)
          : Promise.resolve({ data: [], error: null }),
        studentRecordIds.length
          ? supabaseAdmin
              .from('task_activity')
              .select('user_id, created_at')
              .in('user_id', studentRecordIds)
              .gte('created_at', activityCutoff.toISOString())
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (paymentsByUser.error) throw paymentsByUser.error;
      if (paymentsByEmail.error) throw paymentsByEmail.error;
      if (recentTaskActivity.error) throw recentTaskActivity.error;

      const paidUserIds = new Set<string>();
      const paidEmails = new Set<string>();
      for (const payment of [...(paymentsByUser.data || []), ...(paymentsByEmail.data || [])]) {
        const plan = String(payment.subscription_plan || '').toLowerCase();
        if (plan !== 'monthly' && plan !== 'quarterly') continue;
        if (payment.user_id) paidUserIds.add(payment.user_id);
        if (payment.email) paidEmails.add(String(payment.email).toLowerCase());
      }

      const latestTaskActivityByUserId = new Map<string, string>();
      for (const activity of recentTaskActivity.data || []) {
        const userId = String(activity.user_id);
        if (!latestTaskActivityByUserId.has(userId) && activity.created_at) {
          latestTaskActivityByUserId.set(userId, activity.created_at);
        }
      }

      const mostRecentActivity = (student: typeof students[number]) => {
        const dates = [
          student.last_activity_date,
          latestTaskActivityByUserId.get(String(student.id)),
          student.created_at,
        ]
          .filter((value): value is string => Boolean(value) && !Number.isNaN(new Date(value).getTime()))
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
        return dates[0] || null;
      };

      return NextResponse.json({
        success: true,
        data: students.map((student) => ({
          ...student,
          has_ever_paid:
            paidUserIds.has(student.auth_id) || paidEmails.has(String(student.email || '').toLowerCase()),
          last_activity_at: mostRecentActivity(student),
        })),
      });
    } else if (type === 'recruiter') {
      const { data, error } = await supabaseAdmin
        .from('recruiters')
        .select('*');

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
        return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
