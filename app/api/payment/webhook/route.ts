import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail, sendWelcomeSubscriptionEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔥 WDC/SUPPLY SMART WEBHOOK RECEIVED:", body);

    const accountNumber = body.accountNumber || body.data?.accountNumber;
    const amount = Number(body.amount || body.data?.amount);
    const reference = body.transactionId || body.data?.transactionId || `WEBHK-${Date.now()}`;

    if (!accountNumber || !amount) {
      console.log("Invalid webhook payload structure.");
      return NextResponse.json({ received: true });
    }

    // ==========================================
    // 1. CHECK SIGNUP FEE PAYMENTS (Now Auto-Activates!)
    // ==========================================
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .update({ payment_status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("account_number", accountNumber)
      .eq("payment_status", "pending")
      .select("user_id, email, full_name, track")
      .maybeSingle();

    if (paymentRecord) {
        console.log("Signup fee confirmed for account:", accountNumber);
        
        // 🔥 FIX: Automatically activate their account!
        let daysToAdd = 30; 
        const trackString = String(paymentRecord.track || "").toLowerCase();
        if (trackString.includes('quarterly') || amount >= 10000) {
             daysToAdd = 90;
        }

        const today = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(today.getDate() + daysToAdd);

        await supabaseAdmin
            .from('users')
            .update({ 
                has_completed_onboarding: true,
                subscription_status: 'active',
                subscription_expires_at: expiryDate.toISOString(),
                last_payment_date: today.toISOString(),
                start_date: today.toISOString(),
                renewal_status: 'pending'
            }) 
            .eq('auth_id', paymentRecord.user_id);
            
        if (paymentRecord.email) {
            await sendWelcomeSubscriptionEmail(paymentRecord.email, paymentRecord.full_name);
        }
        
        console.log(`✅ Subscription Engine: Day 0 Activated for ${paymentRecord.email} via Bank Transfer`);
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

      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", wallet.user_id);

      await supabaseAdmin.from("wallet_transactions").upsert({
        user_id: wallet.user_id,
        amount: amount,
        transaction_type: 'INFLOW',
        status: 'SUCCESS',
        reference: reference,
        provider_tx_id: reference,
        source: 'Bank Transfer', 
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
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}