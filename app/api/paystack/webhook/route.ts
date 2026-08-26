import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeSubscriptionEmail } from "@/lib/zeptomail"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PlanType = 'monthly' | 'quarterly';


// // Text Plan Codes (for reference, not used in this file)
// const PLAN_CONFIG: Record<PlanType, { amountInNaira: number; code: string }> = {
//   monthly: {
//     amountInNaira: 15000,
//     code: process.env.PAYSTACK_PLAN_MONTHLY || 'PLN_0a0fy91qz8jff3g',
//   },
//   quarterly: {
//     amountInNaira: 40500,
//     code: process.env.PAYSTACK_PLAN_QUARTERLY || 'PLN_f2c6kpj0yr50ww9',
//   },
// };

 // Live Plan Codes (for reference, not used in this file)
const PLAN_CONFIG: Record<PlanType, { amountInNaira: number; code: string }> = {
  monthly: {
    amountInNaira: 15000,
    code: process.env.PAYSTACK_PLAN_MONTHLY || 'PLN_46z8gz0p4foduy8',
  },
  quarterly: {
    amountInNaira: 40500,
    code: process.env.PAYSTACK_PLAN_QUARTERLY || 'PLN_ddzhasixy441mju',
  },
};

const successfulPaymentStatuses = new Set(['success', 'successful', 'confirmed', 'paid']);

const normalizePlan = (...values: unknown[]): PlanType | null => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim().toLowerCase();

    if (normalized === 'monthly' || normalized === PLAN_CONFIG.monthly.code.toLowerCase()) {
      return 'monthly';
    }

    if (normalized === 'quarterly' || normalized === PLAN_CONFIG.quarterly.code.toLowerCase()) {
      return 'quarterly';
    }
  }

  return null;
};

const planFromAmount = (amount: number): PlanType | null => {
  if (amount === PLAN_CONFIG.monthly.amountInNaira) return 'monthly';
  if (amount === PLAN_CONFIG.quarterly.amountInNaira) return 'quarterly';
  return null;
};

export async function POST(req: Request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: "Paystack is not configured." }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    const hash = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');
    const isLocalTest = process.env.NODE_ENV === "development" && !signature;

    if (hash !== signature && !isLocalTest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`⚡ [Paystack Webhook] Event: ${event.event}`);

    switch (event.event) {
      case 'charge.success': {
        try {
          const ref = event.data.reference;
          const customerEmail = event.data?.customer?.email;
          const customerCode = event.data?.customer?.customer_code;
          const amountPaid = Number(event.data.amount || 0) / 100;

          if (!ref || !Number.isFinite(amountPaid) || amountPaid <= 0) {
            console.error('Paystack charge is missing a valid reference or amount.', event.data);
            return NextResponse.json({ success: true, message: "Invalid payload ignored." });
          }

          const metaUserId = event.data.metadata?.user_id;
          const rawMetaPlan =
            event.data.metadata?.subscriptionPlan ??
            event.data.metadata?.planType ??
            event.data.metadata?.subscription_plan;
            
          const metaPlan = normalizePlan(
            rawMetaPlan,
            event.data.plan?.plan_code,
            event.data.plan?.interval,
          );

          const { data: existingPayment, error: paymentLookupError } = await supabaseAdmin
            .from('payments')
            .select('id, user_id, email, track, amount, full_name, role, subscription_plan, payment_status')
            .eq('reference', ref)
            .maybeSingle();

          if (paymentLookupError) throw paymentLookupError;

          const existingPaymentStatus = String(existingPayment?.payment_status || '').toLowerCase();
          if (existingPayment && successfulPaymentStatuses.has(existingPaymentStatus)) {
            console.log(`⚠️ Duplicate subscription webhook ignored: ${ref}`);
            return NextResponse.json({ success: true, message: "Already processed" });
          }

          const { data: existingTx } = await supabaseAdmin
            .from('wallet_transactions')
            .select('id')
            .eq('reference', ref)
            .maybeSingle();

          if (existingTx) {
            console.log(`⚠️ Duplicate Webhook Ignored: Transaction ${ref} already processed.`);
            return NextResponse.json({ success: true, message: "Duplicate Ignored" });
          }

          const updatedPayment = existingPayment;
          let localPaymentFulfilled = false;

          // 👉 SCENARIO A: DASHBOARD SUBSCRIPTION UPGRADE
          if (metaUserId && metaPlan) {
            const daysToAdd = metaPlan === 'quarterly' ? 90 : 30;

            if (amountPaid !== PLAN_CONFIG[metaPlan].amountInNaira) {
              console.error(`Paystack amount (₦${amountPaid}) does not match the ${metaPlan} plan.`);
              return NextResponse.json({ success: true, message: "Amount mismatch ignored." });
            }

            const { data: currentUser, error: currentUserError } = await supabaseAdmin
              .from('users')
              .select('subscription_expires_at, full_name')
              .eq('auth_id', metaUserId)
              .maybeSingle();

            if (currentUserError) throw currentUserError;
            if (!currentUser) throw new Error(`User not found for subscription payment ${ref}.`);

            let baseDate = new Date();
            if (currentUser?.subscription_expires_at) {
               const currentExpiry = new Date(currentUser.subscription_expires_at);
               if (currentExpiry > baseDate) baseDate = currentExpiry; 
            }
            const expiryDate = new Date(baseDate);
            expiryDate.setDate(expiryDate.getDate() + daysToAdd);

            const { error: subscriptionUpdateError } = await supabaseAdmin.from('users').update({
                has_completed_onboarding: true, 
                subscription_status: 'active', 
                subscription_plan: metaPlan, 
                paystack_customer_code: customerCode, 
                subscription_expires_at: expiryDate.toISOString(),
                last_payment_date: new Date().toISOString(), 
                renewal_status: 'pending'
            }).eq('auth_id', metaUserId);

            if (subscriptionUpdateError) throw subscriptionUpdateError;
            localPaymentFulfilled = true;
            
            if (customerEmail) {
              sendWelcomeSubscriptionEmail(customerEmail, currentUser.full_name || "Student").catch(err => 
                console.error('Subscription welcome email failed:', err)
              );
            }
            console.log(`✅ Subscription Upgraded via Modal for ${metaUserId} (${metaPlan})`);
          }
          
          // 👉 SCENARIO B: FRONTEND-INITIATED
          else if (updatedPayment?.user_id) {
            if (updatedPayment.track === 'wallet_funding') {
              const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('id, balance, account_name, account_number')
                .eq('user_id', updatedPayment.user_id)
                .maybeSingle(); 
                
              if (!wallet) throw new Error(`Wallet not found for payment ${ref}.`);

              const balanceBefore = Number(wallet.balance || 0);
              const fundingAmount = Number(updatedPayment.amount || 0);

              if (!Number.isFinite(fundingAmount) || amountPaid !== fundingAmount) {
                console.error(`Amount mismatch in wallet funding: expected ${fundingAmount}, got ${amountPaid}`);
                return NextResponse.json({ success: true, message: "Amount mismatch" });
              }

              const balanceAfter = balanceBefore + fundingAmount;

              const { error: walletUpdateError } = await supabaseAdmin.from('wallets').update({ balance: balanceAfter, updated_at: new Date().toISOString() }).eq('id', wallet.id);
              if (walletUpdateError) throw walletUpdateError;

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
                  receiver_info: { account_name: wallet.account_name || "WDC Wallet", account_number: wallet.account_number || "Virtual" }
              }]);

              if (txError) throw txError;
              localPaymentFulfilled = true;
            } 
            else {
              const assignedPlan = normalizePlan(updatedPayment.subscription_plan) || planFromAmount(Number(updatedPayment.amount || amountPaid));

              if (!assignedPlan || amountPaid !== PLAN_CONFIG[assignedPlan].amountInNaira) {
                console.error(`Plan mapping failed or amount mismatch for ref ${ref}`);
                return NextResponse.json({ success: true, message: "Plan/Amount mapping error" });
              }

              const daysToAdd = assignedPlan === 'quarterly' ? 90 : 30;

              const { data: currentUser, error: currentUserError } = await supabaseAdmin.from('users').select('subscription_expires_at').eq('auth_id', updatedPayment.user_id).maybeSingle();
              
              if (currentUserError) throw currentUserError;
              if (!currentUser) throw new Error(`User not found for subscription payment ${ref}.`);

              let baseDate = new Date();
              if (currentUser?.subscription_expires_at) {
                 const currentExpiry = new Date(currentUser.subscription_expires_at);
                 if (currentExpiry > baseDate) baseDate = currentExpiry; 
              }
              const expiryDate = new Date(baseDate);
              expiryDate.setDate(expiryDate.getDate() + daysToAdd);

              const { error: subscriptionUpdateError } = await supabaseAdmin.from('users').update({
                  has_completed_onboarding: true, 
                  subscription_status: 'active',
                  subscription_plan: assignedPlan, 
                  paystack_customer_code: customerCode,
                  subscription_expires_at: expiryDate.toISOString(),
                  last_payment_date: new Date().toISOString(), 
                  start_date: currentUser?.subscription_expires_at ? undefined : new Date().toISOString(), 
                  renewal_status: 'pending'
                }).eq('auth_id', updatedPayment.user_id);

              if (subscriptionUpdateError) throw subscriptionUpdateError;
              localPaymentFulfilled = true;
              
              if (customerEmail) {
                sendWelcomeSubscriptionEmail(customerEmail, updatedPayment.full_name || "Student").catch(err => console.error(err));
              }
            }
          } 
          
          // 👉 SCENARIO C: BACKGROUND AUTO-RENEWAL
          else if (event.data.plan?.plan_code) {
            const renewedPlan = normalizePlan(event.data.plan.plan_code, event.data.plan.interval);

            if (!renewedPlan || amountPaid !== PLAN_CONFIG[renewedPlan].amountInNaira) {
              console.error(`Unknown plan or amount mismatch for auto-renewal ${ref}`);
              return NextResponse.json({ success: true, message: "Auto-renewal mapping error" });
            }

            const daysToAdd = renewedPlan === 'quarterly' ? 90 : 30;

            if (!customerEmail) throw new Error(`Renewal ${ref} is missing a customer email.`);

            const { data: userToRenew, error: renewalUserError } = await supabaseAdmin.from('users').select('auth_id, subscription_expires_at').eq('email', customerEmail).maybeSingle();
            if (renewalUserError) throw renewalUserError;

            if (userToRenew) {
              let baseDate = new Date();
              if (userToRenew.subscription_expires_at) {
                 const currentExpiry = new Date(userToRenew.subscription_expires_at);
                 if (currentExpiry > baseDate) baseDate = currentExpiry; 
              }
              const expiryDate = new Date(baseDate);
              expiryDate.setDate(expiryDate.getDate() + daysToAdd);

              const { error: renewalUpdateError } = await supabaseAdmin.from('users').update({
                subscription_status: 'active', 
                subscription_plan: renewedPlan,
                subscription_expires_at: expiryDate.toISOString(), 
                last_payment_date: new Date().toISOString() 
              }).eq('auth_id', userToRenew.auth_id);

              if (renewalUpdateError) throw renewalUpdateError;
              localPaymentFulfilled = true;

              await supabaseAdmin.from('payments').insert({
                user_id: userToRenew.auth_id,
                email: customerEmail,
                full_name: null,
                role: 'student',
                amount: amountPaid,
                subscription_plan: renewedPlan,
                payment_method: 'paystack',
                payment_status: 'success',
                reference: ref,
                confirmed_at: event.data.paid_at || new Date().toISOString(),
              });
              
              console.log(`✅ Auto-Renewal Processed for ${customerEmail}`);
            } else {
              throw new Error(`User not found for renewal payment ${ref}.`);
            }
          }
          
          // 👉 SCENARIO D: DIRECT BANK TRANSFER TO VIRTUAL ACCOUNT (DVA)
          else if (event.data.channel === 'dedicated_nuban' || event.data.authorization?.receiver_bank_account) {
            const accountNumber = event.data.authorization?.receiver_bank_account?.account_number;
            
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
                const balanceBefore = Number(walletData.balance || 0);
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
                return NextResponse.json({ success: true, message: "No wallet found to fund" });
            }
          }

          if (existingPayment && localPaymentFulfilled) {
            const { error: paymentUpdateError } = await supabaseAdmin
              .from('payments')
              .update({
                payment_status: 'success',
                confirmed_at: event.data.paid_at || new Date().toISOString(),
              })
              .eq('id', existingPayment.id);

            if (paymentUpdateError) throw paymentUpdateError;
          }

        } catch (innerError: any) {
           console.error("🔥 Error processing charge.success:", innerError?.message || innerError);
           // Rethrowing will send a 500. Paystack will retry. Only do this for database crashes.
           throw innerError; 
        }
        break;
      }

      case 'customeridentification.success': {
        const customerCode = event.data.customer_code;
        const isTestMode = process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test');
        const reqBody: { customer: string; preferred_bank?: string } = { customer: customerCode };
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
        await supabaseAdmin.from('users').update({ 
           kyc_status: 'failed', 
        }).eq('paystack_customer_code', event.data.customer_code);
        break;
      }

      case 'dedicatedaccount.assign.success': {
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
  } catch (error: any) {
    console.error("🔥 Webhook Fatal Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}