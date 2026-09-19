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

      const students = data || [];
      const [{ data: wallets, error: walletError }, { data: payments, error: paymentError }] = await Promise.all([
        supabaseAdmin.from('wallets').select('user_id, account_number'),
        supabaseAdmin
          .from('payments')
          .select('user_id, email, subscription_plan, payment_status')
          .in('payment_status', ['success', 'successful', 'confirmed', 'paid']),
      ]);

      if (walletError) throw walletError;
      if (paymentError) throw paymentError;

      const walletOwners = new Set(
        (wallets || [])
          .filter((wallet) => wallet.account_number && wallet.account_number !== '****')
          .map((wallet) => String(wallet.user_id)),
      );
      const paidUserIds = new Set<string>();
      const paidEmails = new Set<string>();
      (payments || []).forEach((payment) => {
        const plan = String(payment.subscription_plan || '').trim().toLowerCase();
        if (plan !== 'monthly' && plan !== 'quarterly') return;
        if (payment.user_id) paidUserIds.add(String(payment.user_id));
        if (payment.email) paidEmails.add(String(payment.email).toLowerCase());
      });

      return NextResponse.json({
        success: true,
        data: students.map((student) => ({
          ...student,
          last_activity_at: student.last_active_at,
          has_wallet: walletOwners.has(String(student.auth_id)),
          has_ever_paid:
            paidUserIds.has(String(student.auth_id)) ||
            paidEmails.has(String(student.email || '').toLowerCase()),
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
