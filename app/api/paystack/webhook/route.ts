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
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const ref = event.data.reference;
      const customerEmail = event.data.customer.email;

      const { data: updatedPayment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({ payment_status: 'successful', confirmed_at: new Date().toISOString() })
        .eq('reference', ref)
        .select('user_id, track, amount, full_name') 
        .single();

      if (paymentError) throw paymentError;

      if (updatedPayment?.user_id) {
        
        // ====================================================
        // 👉 SCENARIO A: WALLET FUNDING (REMAINING UNTOUCHED)
        // ====================================================
        if (updatedPayment.track === 'wallet_funding') {
          const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('balance, account_name, account_number')
            .eq('user_id', updatedPayment.user_id)
            .maybeSingle(); 
            
          const balanceBefore = wallet?.balance || 0;
          const fundingAmount = updatedPayment.amount || 0;
          const balanceAfter = balanceBefore + fundingAmount;

          await supabaseAdmin
            .from('wallets')
            .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
            .eq('user_id', updatedPayment.user_id);

          await supabaseAdmin
            .from('wallet_transactions')
            .upsert({
              user_id: updatedPayment.user_id,
              email: customerEmail,
              reference: ref, 
              transaction_type: 'INFLOW',
              funding_method: 'PAYSTACK_CARD',
              amount: fundingAmount,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              status: 'SUCCESS',
              provider_tx_id: `PAYSTACK-${ref}`,
              source: 'PAYSTACK',
              created_at: event.data.paid_at || new Date().toISOString(),
              receiver_info: { 
                wallet_name: wallet?.account_name || "WDC Wallet", 
                account_number: wallet?.account_number || "Virtual" 
              }
            }, { onConflict: 'provider_tx_id' });
        } 
        // ====================================================
        // 👉 SCENARIO B: STANDARD REGISTRATION & DAY 0 ACTIVATION
        // ====================================================
        else {
          const today = new Date();
          const expiryDate = new Date();
          expiryDate.setDate(today.getDate() + 30);

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
            .eq('auth_id', updatedPayment.user_id); // Using auth_id as per your schema
          
          await sendWelcomeSubscriptionEmail(customerEmail, updatedPayment.full_name);
            
          console.log(`Subscription Engine: Day 0 Activated for ${customerEmail}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}