import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { reference, userId } = await req.json();
    console.log("💳 Verifying Paystack Ref:", reference);

    // 1. Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json({ success: false, message: "Paystack verification failed" }, { status: 400 });
    }

    const amountFunded = paystackData.data.amount / 100;
    const userEmail = paystackData.data.customer.email;

    // 2. Get current wallet balance
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
    const oldBalance = wallet?.balance || 0;
    const newBalance = oldBalance + amountFunded;

    // 3. Update Wallet Balance
    const { error: balError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (balError) throw new Error("Balance update failed: " + balError.message);

    // 4. Log the Ledger Entry (Matches your DB Columns exactly)
    console.log("📝 Attempting to log Ledger entry for Paystack...");
    
    const { error: txError } = await supabaseAdmin.from('wallet_transactions').upsert({
      user_id: userId,
      email: userEmail,
      amount: amountFunded,
      transaction_type: 'INFLOW', // Must be Uppercase
      funding_method: 'PAYSTACK_CARD', // Matches the SQL Check Constraint
      balance_before: oldBalance,
      balance_after: newBalance,
      status: 'SUCCESS', // Must be Uppercase
      reference: reference,
      provider_tx_id: `PAYSTACK-${reference}`,
      source: 'PAYSTACK',
      created_at: paystackData.data.paid_at || new Date().toISOString()
    }, { onConflict: 'provider_tx_id' });

    if (txError) {
      console.error("❌ LEDGER ERROR:", txError.message);
      // We don't return 500 here because the money is already in the wallet!
      // We just tell the UI that history might take a second to sync.
      return NextResponse.json({ success: true, newBalance, warning: "Ledger sync delayed" });
    }

    console.log("✅ Paystack funding fully completed and logged.");
    return NextResponse.json({ success: true, newBalance });

  } catch (err: any) {
    console.error("🔥 Paystack Verify Crash:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}