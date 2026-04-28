import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔥 WDC/SUPPLY SMART WEBHOOK RECEIVED:", body);

    // Adapt to match the exact webhook JSON structure sent by your provider
    const accountNumber = body.accountNumber || body.data?.accountNumber;
    const amount = Number(body.amount || body.data?.amount);
    const reference = body.transactionId || body.data?.transactionId || `WEBHK-${Date.now()}`;

    if (!accountNumber || !amount) {
      console.log("Invalid webhook payload structure.");
      return NextResponse.json({ received: true });
    }

    // ==========================================
    // 1. CHECK SIGNUP FEE PAYMENTS (Onboarding)
    // ==========================================
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .update({ payment_status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("account_number", accountNumber)
      .eq("payment_status", "pending")
      .select("user_id, email, full_name")
      .maybeSingle();

    if (paymentRecord) {
        console.log("Signup fee confirmed for account:", accountNumber);
        // You could optionally update user status here if needed
    }

    // ==========================================
    // 2. CHECK VIRTUAL WALLET & LOG DEPOSIT
    // ==========================================
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("user_id, balance, account_name")
      .eq("account_number", accountNumber)
      .maybeSingle();

    if (wallet) {
      const newBalance = Number(wallet.balance || 0) + amount;

      // Update Live Balance
      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", wallet.user_id);

      // Log to Unified Transactions Table
      await supabaseAdmin.from("wallet_transactions").upsert({
        user_id: wallet.user_id,
        amount: amount,
        transaction_type: 'INFLOW',
        status: 'SUCCESS',
        reference: reference,
        provider_tx_id: reference,
        source: 'Bank Transfer', // Or dynamically grab sender name if available in webhook payload
        created_at: new Date().toISOString()
      }, { onConflict: 'provider_tx_id' });

      console.log(`✅ Wallet credited: +₦${amount} for user ${wallet.user_id}. New Balance: ₦${newBalance}`);

      // ==========================================
      // 3. TRIGGER DEPOSIT EMAIL (Zeptomail)
      // ==========================================
      const { data: user } = await supabaseAdmin
        .from("users").select("email").eq("auth_id", wallet.user_id).single();

      if (user?.email) {
        await sendDepositEmail(
          user.email, 
          wallet.account_name, 
          amount, 
          newBalance, 
          reference
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("WEBHOOK FATAL ERROR:", err.message);
    // Always return 200 to webhooks so the provider doesn't keep retrying and spamming your server
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}