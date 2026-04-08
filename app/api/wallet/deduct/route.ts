import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize inside the route with ! to satisfy the Vercel build worker
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, reference, description } = await req.json();

    // 1. Fetch from the 'wallets' table (NOT the 'users' table)
    const { data: wallet, error: walletError } = await supabaseAdmin!
      .from("wallets")
      .select("balance, user_id")
      .eq("user_id", userId) // Using user_id to match our GlobalWallet logic
      .single();

    if (walletError || !wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const balanceBefore = Number(wallet.balance || 0);
    if (balanceBefore < amount) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // 2. Fetch User Email for the ledger requirement
    const { data: userRecord } = await supabaseAdmin!
      .from('users')
      .select('email')
      .eq('auth_id', userId)
      .single();

    const balanceAfter = balanceBefore - amount;

    // 3. Update the 'wallets' table balance
    const { error: updateError } = await supabaseAdmin!
      .from("wallets")
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // 4. Log to the Unified 'wallet_transactions' table
    const txRef = reference || `WDC-DED-${Date.now()}`;
    
    await supabaseAdmin!.from("wallet_transactions").upsert({
      user_id: userId,
      email: userRecord?.email || 'N/A',
      amount: amount,
      transaction_type: 'OUTFLOW',
      funding_method: 'SYSTEM_DEDUCTION', // Matches our SQL check constraint
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'SUCCESS',
      reference: txRef,
      provider_tx_id: `SYS-${txRef}`,
      source: 'WDC_INTERNAL',
      created_at: new Date().toISOString()
    }, { onConflict: 'provider_tx_id' });

    return NextResponse.json({ success: true, newBalance: balanceAfter });

  } catch (err: any) {
    console.error("🔥 Deduction Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}