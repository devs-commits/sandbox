import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { candidateId, type, amount } = await request.json();

    if (!candidateId || !type || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    // 3. Check if already unlocked
    const { data: existingUnlock } = await supabaseAdmin
      .from('recruiter_unlocks')
      .select('id')
      .eq('recruiter_id', recruiter.id)
      .eq('candidate_id', candidateId)
      .eq('unlock_type', type)
      .single();

    if (existingUnlock) {
      return NextResponse.json({ success: true, message: "Already unlocked", newBalance: recruiter.wallet_balance });
    }

    const currentBalance = Number(recruiter.wallet_balance || 0);
    const deductionAmount = Number(amount);

    if (currentBalance < deductionAmount) {
      return NextResponse.json({ success: false, error: "Insufficient funds" }, { status: 400 });
    }

    // 4. Deduct Balance
    const newBalance = currentBalance - deductionAmount;

    const { error: updateError } = await supabaseAdmin
      .from('recruiters')
      .update({ wallet_balance: newBalance })
      .eq('id', recruiter.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return NextResponse.json({ success: false, error: "Failed to update balance" }, { status: 500 });
    }

    // 5. Record Transaction
    await supabaseAdmin
      .from('recruiter_transactions')
      .insert({
        recruiter_id: recruiter.id,
        amount: deductionAmount,
        type: 'debit',
        description: `Unlocked ${type}: Candidate ${candidateId.slice(0, 8)}...`,
        reference: `unlock_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      });

    // 6. Record Unlock
    const { error: unlockError } = await supabaseAdmin
      .from('recruiter_unlocks')
      .insert({
        recruiter_id: recruiter.id,
        candidate_id: candidateId,
        unlock_type: type
      });

    if (unlockError) {
      console.error("Error recording unlock:", unlockError);
      // In a real app, we might want to rollback the transaction here
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
