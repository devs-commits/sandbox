import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeSubscriptionEmail } from "@/lib/zeptomail"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex');

    // 🚨 LOCAL TESTING BYPASS
    const isLocalTest = process.env.NODE_ENV === "development" && !signature;

    if (hash !== signature && !isLocalTest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`⚡ [Paystack Webhook] Event: ${event.event}`);

    switch (event.event) {
      // ====================================================
      // 1. CHARGES & SUBSCRIPTIONS
      // ====================================================
      case 'charge.success': {
        const ref = event.data.reference;
        const customerEmail = event.data?.customer?.email;
        const customerCode = event.data?.customer?.customer_code;
        const amountPaid = event.data.amount / 100; // Convert Kobo to Naira

        // 🔥 Extract Metadata from the new Subscription Modal
        const metaUserId = event.data.metadata?.user_id;
        const metaPlan = event.data.metadata?.subscription_plan; // "MONTHLY" or "QUARTERLY"

        // 🔥 IDEMPOTENCY CHECK (Wallet)
        const { data: existingTx } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id')
          .eq('reference', ref)
          .maybeSingle();

        if (existingTx) {
          console.log(`⚠️ Duplicate Webhook Ignored: Transaction ${ref} already processed.`);
          return NextResponse.json({ success: true, message: "Duplicate Ignored" });
        }

        // Attempt to find the payment if it was initiated from the original onboarding flow
        const { data: updatedPayment } = await supabaseAdmin
          .from('payments')
          .update({ payment_status: 'successful', confirmed_at: new Date().toISOString() })
          .eq('reference', ref)
          .select('user_id, track, amount, full_name') 
          .maybeSingle();

        // 👉 SCENARIO A: DASHBOARD SUBSCRIPTION UPGRADE (From the New Modal)
        if (metaUserId && metaPlan) {
          let daysToAdd = metaPlan === 'QUARTERLY' ? 90 : 30;

          const { data: currentUser } = await supabaseAdmin
            .from('users')
            .select('subscription_expires_at, full_name')
            .eq('auth_id', metaUserId)
            .maybeSingle();

          let baseDate = new Date();
          if (currentUser?.subscription_expires_at) {
             const currentExpiry = new Date(currentUser.subscription_expires_at);
             if (currentExpiry > baseDate) baseDate = currentExpiry; 
          }
          const expiryDate = new Date(baseDate);
          expiryDate.setDate(expiryDate.getDate() + daysToAdd);

          await supabaseAdmin.from('users').update({ 
              has_completed_onboarding: true, 
              subscription_status: 'active', 
              subscription_plan: metaPlan, 
              paystack_customer_code: customerCode, 
              subscription_expires_at: expiryDate.toISOString(),
              last_payment_date: new Date().toISOString(), 
              renewal_status: 'pending'
          }).eq('auth_id', metaUserId);
          
          await sendWelcomeSubscriptionEmail(customerEmail, currentUser?.full_name || "Student");
          console.log(`✅ Subscription Upgraded via Modal for ${metaUserId} (${metaPlan})`);
        }
        
        // 👉 SCENARIO B: FRONTEND-INITIATED (Original Onboarding or Card Wallet Funding)
        else if (updatedPayment?.user_id) {
          if (updatedPayment.track === 'wallet_funding') {
            const { data: wallet } = await supabaseAdmin
              .from('wallets')
              .select('balance, account_name, account_number')
              .eq('user_id', updatedPayment.user_id)
              .maybeSingle(); 
              
            const balanceBefore = wallet?.balance || 0;
            const fundingAmount = updatedPayment.amount || 0;
            const balanceAfter = balanceBefore + fundingAmount;

            await supabaseAdmin.from('wallets').update({ balance: balanceAfter, updated_at: new Date().toISOString() }).eq('user_id', updatedPayment.user_id);

            const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert([{
                user_id: updatedPayment.user_id,
                email: customerEmail,
                reference: ref, 
                transaction_type: 'INFLOW',
                funding_method: 'PAYSTACK_CARD',
                amount: fundingAmount,
                total_amount: fundingAmount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                status: 'SUCCESS',
                provider_tx_id: `PAYSTACK-${ref}`,
                source: 'Debit Card Deposit',
                created_at: event.data.paid_at || new Date().toISOString(),
                receiver_info: { account_name: wallet?.account_name || "WDC Wallet", account_number: wallet?.account_number || "Virtual" }
            }]);

            if (txError) console.error("🚨 Card Ledger Insert Error:", txError.message);
          } 
          else {
            // Initial Subscription Activation
            let daysToAdd = 30; 
            const trackString = String(updatedPayment.track || "").toLowerCase();
            let assignedPlan = 'MONTHLY';
            
            if (trackString.includes('quarterly') || updatedPayment.amount >= 10000) {
              daysToAdd = 90;
              assignedPlan = 'QUARTERLY';
            }

            const { data: currentUser } = await supabaseAdmin.from('users').select('subscription_expires_at').eq('auth_id', updatedPayment.user_id).maybeSingle();
            let baseDate = new Date();
            if (currentUser?.subscription_expires_at) {
               const currentExpiry = new Date(currentUser.subscription_expires_at);
               if (currentExpiry > baseDate) baseDate = currentExpiry; 
            }
            const expiryDate = new Date(baseDate);
            expiryDate.setDate(expiryDate.getDate() + daysToAdd);

            await supabaseAdmin.from('users').update({ 
                has_completed_onboarding: true, 
                subscription_status: 'active',
                subscription_plan: assignedPlan, 
                paystack_customer_code: customerCode,
                subscription_expires_at: expiryDate.toISOString(),
                last_payment_date: new Date().toISOString(), 
                start_date: currentUser?.subscription_expires_at ? undefined : new Date().toISOString(), 
                renewal_status: 'pending'
              }).eq('auth_id', updatedPayment.user_id);
            
            await sendWelcomeSubscriptionEmail(customerEmail, updatedPayment.full_name);
          }
        } 
        
        // 👉 SCENARIO C: BACKGROUND AUTO-RENEWAL
        else if (event.data.plan?.plan_code) {
          let daysToAdd = event.data.plan.interval === 'quarterly' ? 90 : 30;
          let renewedPlan = event.data.plan.interval === 'quarterly' ? 'QUARTERLY' : 'MONTHLY';

          const { data: userToRenew } = await supabaseAdmin.from('users').select('auth_id, subscription_expires_at').eq('email', customerEmail).maybeSingle();

          if (userToRenew) {
            let baseDate = new Date();
            if (userToRenew.subscription_expires_at) {
               const currentExpiry = new Date(userToRenew.subscription_expires_at);
               if (currentExpiry > baseDate) baseDate = currentExpiry; 
            }
            const expiryDate = new Date(baseDate);
            expiryDate.setDate(expiryDate.getDate() + daysToAdd);

            await supabaseAdmin.from('users').update({ 
              subscription_status: 'active', 
              subscription_plan: renewedPlan,
              subscription_expires_at: expiryDate.toISOString(), 
              last_payment_date: new Date().toISOString() 
            }).eq('auth_id', userToRenew.auth_id);
            
            console.log(`✅ Auto-Renewal Processed for ${customerEmail}`);
          }
        }
        
        // 👉 SCENARIO D: DIRECT BANK TRANSFER TO VIRTUAL ACCOUNT (DVA)
        else if (event.data.channel === 'dedicated_nuban' || event.data.authorization?.receiver_bank_account) {
          const accountNumber = event.data.authorization?.receiver_bank_account?.account_number;
          
          // 🔥 ROBUST FALLBACK: Find user by Account Number OR Customer Code
          let targetUserId = null;
          let walletData = null;

          if (accountNumber) {
            const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('account_number', accountNumber).maybeSingle();
            if (wallet) {
               targetUserId = wallet.user_id;
               walletData = wallet;
            }
          }

          if (!targetUserId && customerCode) {
            const { data: user } = await supabaseAdmin.from('users').select('auth_id').eq('paystack_customer_code', customerCode).maybeSingle();
            if (user) {
               targetUserId = user.auth_id;
               const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', targetUserId).maybeSingle();
               walletData = wallet;
            }
          }

          if (targetUserId && walletData) {
              const balanceBefore = walletData.balance || 0;
              const fundingAmount = amountPaid;
              const balanceAfter = balanceBefore + fundingAmount;

              const narration = event.data.authorization?.narration || 'Wallet Funding via Bank Transfer';
              const senderName = event.data.authorization?.sender_name || event.data.authorization?.sender_bank_account?.account_name || '';
              const cleanSource = senderName ? `Bank Transfer from ${senderName}` : 'Bank Transfer Deposit';

              await supabaseAdmin.from('wallets').update({ balance: balanceAfter, updated_at: new Date().toISOString() }).eq('id', walletData.id);

              const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert([{
                 user_id: targetUserId,
                 reference: ref,
                 transaction_type: 'INFLOW',
                 funding_method: 'BANK_TRANSFER',
                 amount: fundingAmount,
                 total_amount: fundingAmount,
                 balance_before: balanceBefore,
                 balance_after: balanceAfter,
                 status: 'SUCCESS',
                 provider_tx_id: `PAYSTACK-${ref}`,
                 source: cleanSource, 
                 description: narration, 
                 created_at: event.data.paid_at || new Date().toISOString(),
                 receiver_info: { account_name: walletData.account_name, account_number: walletData.account_number }
              }]);

              if (txError) console.error("🚨 DVA Ledger Insert Error:", txError.message);

              const { data: userRecord } = await supabaseAdmin.from('users').select('wallet_balance').eq('auth_id', targetUserId).single();
              if (userRecord) {
                 await supabaseAdmin.from('users').update({ wallet_balance: (userRecord.wallet_balance || 0) + fundingAmount }).eq('auth_id', targetUserId);
              }
              console.log(`✅ DVA Funded: ₦${fundingAmount} to ${walletData.account_name}`);
          } else {
              console.error(`🔴 Deposit failed: No wallet found for transfer reference ${ref}`);
          }
        }
        break;
      }

      // ====================================================
      // 2. VIRTUAL WALLET (DVA) EVENTS
      // ====================================================
      case 'customeridentification.success': {
        const customerCode = event.data.customer_code;
        // 🔥 FIX: Test Mode dynamically handled so it doesn't crash on 'test-bank'
        const isTestMode = process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test');
        const reqBody: any = { customer: customerCode };
        if (!isTestMode) reqBody.preferred_bank = "titan-paystack";

        const dvaRes = await fetch("https://api.paystack.co/dedicated_account", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });
        if (!dvaRes.ok) console.error('🚨 DVA Creation Failed:', await dvaRes.json());
        break;
      }

      case 'customeridentification.failed': {
        // 🔥 FIX: We must update the 'users' table, not 'wallets'
        await supabaseAdmin.from('users').update({ 
           kyc_status: 'failed', 
        }).eq('paystack_customer_code', event.data.customer_code);
        break;
      }

      case 'dedicatedaccount.assign.success': {
        // 🔥 FIX: Safely retrieve the user_id from the users table first!
        const custCode = event.data.customer.customer_code;
        const { data: user } = await supabaseAdmin.from('users').select('auth_id').eq('paystack_customer_code', custCode).maybeSingle();
        
        if (user) {
           await supabaseAdmin.from('wallets').upsert({
              user_id: user.auth_id,
              bank_name: event.data.dedicated_account.bank.name,
              account_number: event.data.dedicated_account.account_number,
              account_name: event.data.dedicated_account.account_name,
              updated_at: new Date().toISOString()
           }, { onConflict: 'user_id' });
           
           await supabaseAdmin.from('users').update({ kyc_status: 'verified' }).eq('auth_id', user.auth_id);
           console.log(`✅ Webhook: DVA Assigned successfully for ${user.auth_id}`);
        }
        break;
      }

      default:
        console.log(`[Paystack Webhook] Ignored event: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}