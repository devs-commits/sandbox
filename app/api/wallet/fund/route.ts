import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { reference, amount } = await request.json();

    // 1. Verify User Session
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: request.headers.get('Authorization') || '' } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // 2. Check for existing transaction (Idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTx) return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 409 });

    // 3. Verify with Paystack
    let verifiedAmount = 0;
    if (process.env.PAYSTACK_SECRET_KEY) {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const paystackData = await paystackRes.json();
      if (!paystackData.status || paystackData.data.status !== 'success') {
        throw new Error("Invalid transaction status");
      }
      verifiedAmount = paystackData.data.amount / 100; // Convert Kobo to Naira
    } else {
      verifiedAmount = Number(amount); // Dev fallback
    }

    // 4. Update Student/User Wallet
    const { data: student } = await supabaseAdmin.from('users').select('id, wallet_balance').eq('auth_id', user.id).single();
    if (!student) return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });

    const newBalance = (student.wallet_balance || 0) + verifiedAmount;
    await supabaseAdmin.from('users').update({ wallet_balance: newBalance }).eq('auth_id', user.id);

    // 5. Log Transaction (Ledger)
    await supabaseAdmin.from('transactions').insert({
      auth_id: user.id,
      amount: verifiedAmount,
      type: 'credit',
      source: 'paystack',
      description: 'Wallet Funding via Card',
      reference: reference,
    });

    return NextResponse.json({ success: true, newBalance });

  } catch (error: any) {
    console.error("Funding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}