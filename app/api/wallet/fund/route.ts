import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize with ! to guarantee it's not null during build
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { reference, amount } = await req.json();

    // 1. Verify User Session (Security)
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Idempotency Check: Prevent duplicate funding in the Unified Ledger
    const { data: existingTx } = await supabaseAdmin!
      .from('wallet_transactions')
      .select('id')
      .eq('provider_tx_id', `PAYSTACK-${reference}`)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 409 });
    }

    // 3. Verify with Paystack (The Source of Truth)
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    const verifiedAmount = paystackData.data.amount / 100;
    const customerEmail = paystackData.data.customer.email;

    // 4. Update the 'wallets' Table Balance
    const { data: wallet } = await supabaseAdmin!
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const balanceBefore = Number(wallet?.balance || 0);
    const balanceAfter = balanceBefore + verifiedAmount;

    await supabaseAdmin!
      .from('wallets')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // 5. Log to the Unified Ledger (wallet_transactions)
    // Satisfies all NOT NULL constraints: funding_method, balance_before, balance_after
    await supabaseAdmin!.from('wallet_transactions').upsert({
      user_id: user.id,
      email: customerEmail,
      amount: verifiedAmount,
      transaction_type: 'INFLOW',
      funding_method: 'PAYSTACK_CARD',
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'SUCCESS',
      reference: reference,
      provider_tx_id: `PAYSTACK-${reference}`,
      source: 'PAYSTACK',
      created_at: paystackData.data.paid_at || new Date().toISOString()
    }, { onConflict: 'provider_tx_id' });

    return NextResponse.json({ success: true, newBalance: balanceAfter });

  } catch (error: any) {
    console.error("🔥 Funding API Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}