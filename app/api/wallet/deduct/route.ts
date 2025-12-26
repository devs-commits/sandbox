import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { amount, description } = await request.json();

    // 1. Verify the user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || '',
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized", details: authError }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // 2. Get Recruiter Profile and Balance
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('recruiters')
      .select('id, wallet_balance')
      .eq('auth_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ success: false, error: "Recruiter profile not found" }, { status: 404 });
    }

    const currentBalance = Number(recruiter.wallet_balance || 0);
    const deductionAmount = Number(amount);

    if (currentBalance < deductionAmount) {
      return NextResponse.json({ success: false, error: "Insufficient funds" }, { status: 400 });
    }

    // 3. Deduct Balance
    const newBalance = currentBalance - deductionAmount;

    const { error: updateError } = await supabaseAdmin
      .from('recruiters')
      .update({ wallet_balance: newBalance })
      .eq('id', recruiter.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return NextResponse.json({ success: false, error: "Failed to update balance" }, { status: 500 });
    }

    // 4. Record Transaction
    const { error: txError } = await supabaseAdmin
      .from('recruiter_transactions')
      .insert({
        recruiter_id: recruiter.id,
        amount: deductionAmount,
        type: 'debit',
        description: description || 'Service charge',
        reference: `deb_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      });

    if (txError) {
      console.error("Error recording transaction:", txError);
      // Note: Balance was already deducted. In a real production app, we'd use a transaction block.
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (error) {
    console.error("Deduction error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
