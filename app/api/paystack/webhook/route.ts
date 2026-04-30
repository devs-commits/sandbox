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
          // ... (Keep your exact wallet funding logic here) ...
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
        // 👉 SCENARIO B: SUBSCRIPTION ACTIVATION (FIXED)
        // ====================================================
        else {
          // 1. Determine Monthly vs Quarterly
          let daysToAdd = 30; // Default Monthly
          const trackString = String(updatedPayment.track || "").toLowerCase();
          
          // 🔥 Change this amount to match whatever your actual Quarterly price is (e.g., > 10000)
          if (trackString.includes('quarterly') || updatedPayment.amount >= 10000) {
             daysToAdd = 90;
          }

          // 2. Fetch User's current expiry to stack dates safely
          const { data: currentUser } = await supabaseAdmin
            .from('users')
            .select('subscription_expires_at')
            .eq('auth_id', updatedPayment.user_id)
            .maybeSingle();

          let baseDate = new Date();
          
          if (currentUser?.subscription_expires_at) {
             const currentExpiry = new Date(currentUser.subscription_expires_at);
             // If they are renewing before it expires, add the new days on top of their remaining time!
             if (currentExpiry > baseDate) {
                 baseDate = currentExpiry; 
             }
          }

          const expiryDate = new Date(baseDate);
          expiryDate.setDate(expiryDate.getDate() + daysToAdd);

          // 3. Activate User Profile
          await supabaseAdmin
            .from('users')
            .update({ 
              has_completed_onboarding: true,
              subscription_status: 'active',
              subscription_expires_at: expiryDate.toISOString(),
              last_payment_date: new Date().toISOString(),
              start_date: currentUser?.subscription_expires_at ? undefined : new Date().toISOString(), // Only set start date if brand new
              renewal_status: 'pending'
            }) 
            .eq('auth_id', updatedPayment.user_id);
          
          await sendWelcomeSubscriptionEmail(customerEmail, updatedPayment.full_name);
            
          console.log(`✅ Subscription Engine: Added ${daysToAdd} days for ${customerEmail}. Expires: ${expiryDate.toISOString()}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}