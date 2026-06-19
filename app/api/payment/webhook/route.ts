import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail, sendWelcomeSubscriptionEmail, sendReferralSuccessEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ==========================================
    // 0. SECURITY: VERIFY WEBHOOK ORIGIN
    // ==========================================
    // Ask Supply Smart how they secure webhooks (e.g., a specific header or IP address).
    // For now, we enforce a secret token check.
    const authHeader = req.headers.get("x-webhook-secret") || req.headers.get("authorization");
    if (authHeader !== process.env.SUPPLY_SMART_WEBHOOK_SECRET) {
        console.error("🚨 WEBHOOK REJECTED: Invalid or missing security token.");
        // Always return 200 to hackers so they don't know the URL is valid, 
        // or 401 if the provider specifically requires it for retries.
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }); 
    }

    const body = await req.json();
    console.log("🔥 WDC/SUPPLY SMART WEBHOOK RECEIVED:", body);

    const accountNumber = body.accountNumber || body.data?.accountNumber;
    const amount = Number(body.amount || body.data?.amount);
    const reference = body.transactionId || body.data?.transactionId;

    // If there is no reference, we can't safely prevent double-crediting
    if (!accountNumber || !amount || !reference) {
      console.error("🚨 WEBHOOK ERROR: Missing account, amount, or reference.");
      return NextResponse.json({ received: true }); 
    }

    // ==========================================
    // 1. IDEMPOTENCY: PREVENT DOUBLE CREDITING
    // ==========================================
    // Check if we have ALREADY processed this exact transaction reference
    const { data: existingTx } = await supabaseAdmin
        .from("wallet_transactions")
        .select("id")
        .eq("provider_tx_id", reference)
        .maybeSingle();

    if (existingTx) {
        console.log(`⚠️ WEBHOOK IGNORED: Transaction ${reference} already processed.`);
        return NextResponse.json({ success: true, message: "Already processed" });
    }

    // ==========================================
    // 2. CHECK SIGNUP FEE PAYMENTS
    // ==========================================
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .select("user_id, email, full_name, track")
      .eq("account_number", accountNumber)
      .eq("payment_status", "pending")
      .maybeSingle();

    if (paymentRecord) {
        console.log("Signup fee confirmed for account:", accountNumber);
        
        await supabaseAdmin
            .from("payments")
            .update({ payment_status: "confirmed", confirmed_at: new Date().toISOString() })
            .eq("account_number", accountNumber);
            
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

        // ==========================================
        // 🚀 NEW: REFERRAL PAYOUT ENGINE
        // ==========================================
        try {
            // 1. Check if this paying user has a pending referral
            const { data: referralRecord } = await supabaseAdmin
                .from('referrals')
                .select('id, referrer_id, status')
                .eq('referred_id', paymentRecord.user_id)
                .eq('status', 'pending')
                .maybeSingle();

            if (referralRecord) {
                // 2. Calculate the 10% commission
                const commissionAmount = amount * 0.10; 

                // 3. Update the referral status to 'active'
                await supabaseAdmin
                    .from('referrals')
                    .update({ status: 'active', amount_earned: commissionAmount })
                    .eq('id', referralRecord.id);

                // 4. Credit the Referrer's Wallet
                const { data: referrerWallet } = await supabaseAdmin
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', referralRecord.referrer_id)
                    .maybeSingle();

                if (referrerWallet) {
                    const newReferrerBalance = Number(referrerWallet.balance || 0) + commissionAmount;
                    
                    await Promise.all([
                        supabaseAdmin
                            .from('wallets')
                            .update({ balance: newReferrerBalance, updated_at: new Date().toISOString() })
                            .eq('user_id', referralRecord.referrer_id),
                        
                        supabaseAdmin.from('wallet_transactions').insert({
                            user_id: referralRecord.referrer_id,
                            amount: commissionAmount,
                            transaction_type: 'INFLOW',
                            status: 'SUCCESS',
                            reference: `REF-COMM-${referralRecord.id}-${Date.now()}`,
                            provider_tx_id: `REF-COMM-${referralRecord.id}-${Date.now()}`,
                            source: 'Referral Commission',
                            created_at: new Date().toISOString()
                        })
                    ]);
                    
                    console.log(`💰 Referral Commission of ₦${commissionAmount} paid to user ${referralRecord.referrer_id}`);

                    // 5. Get Referrer's email
                    const { data: referrerDetails } = await supabaseAdmin
                        .from('users')
                        .select('email, full_name')
                        .eq('auth_id', referralRecord.referrer_id)
                        .maybeSingle();

                    if (referrerDetails?.email) {
                        // 6. FIRE THE SUCCESS EMAIL!
                        await sendReferralSuccessEmail(
                            referrerDetails.email, 
                            referrerDetails.full_name || "Partner", 
                            paymentRecord.full_name || "Your referral", 
                            commissionAmount
                        );
                    }
                }
            }
        } catch (refError) {
            console.error("🚨 Referral Payout Error:", refError);
            // We catch this specifically so a referral crash doesn't break the main payment confirmation
        }
    }

    // ==========================================
    // 3. CHECK VIRTUAL WALLET & LOG DEPOSIT
    // ==========================================
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("user_id, balance, account_name")
      .eq("account_number", accountNumber)
      .maybeSingle();

    if (wallet) {
      const newBalance = Number(wallet.balance || 0) + amount;

      // Wrap in a Promise.all to execute both DB updates simultaneously for speed
      await Promise.all([
          supabaseAdmin
            .from("wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", wallet.user_id),
            
          supabaseAdmin.from("wallet_transactions").insert({
            user_id: wallet.user_id,
            amount: amount,
            transaction_type: 'INFLOW',
            status: 'SUCCESS',
            reference: reference,
            provider_tx_id: reference,
            source: 'Bank Transfer', 
            created_at: new Date().toISOString()
          })
      ]);

      console.log(`✅ Wallet credited: +₦${amount} for user ${wallet.user_id}. New Balance: ₦${newBalance}`);

      if (wallet.user_id) {
        const { data: user } = await supabaseAdmin
          .from("users").select("email").eq("auth_id", wallet.user_id).single();

        if (user?.email) {
          await sendDepositEmail(user.email, wallet.account_name, amount, newBalance, reference);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("WEBHOOK FATAL ERROR:", err.message);
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}