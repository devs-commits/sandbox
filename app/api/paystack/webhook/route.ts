import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    // 1. Signature Verification
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

      // Update the general payments tracking
      const { data: updatedPayment, error: paymentError } = await supabaseAdmin!
        .from('payments')
        .update({ payment_status: 'successful', confirmed_at: new Date().toISOString() })
        .eq('reference', ref)
        .select('user_id, track, amount')
        .single();

      if (paymentError) throw paymentError;

      if (updatedPayment?.user_id) {
        
        // ====================================================
        // 👉 SCENARIO A: WALLET FUNDING (UNIFIED LEDGER)
        // ====================================================
        if (updatedPayment.track === 'wallet_funding') {
          
          const { data: wallet } = await supabaseAdmin!
            .from('wallets')
            .select('balance, account_name, account_number')
            .eq('user_id', updatedPayment.user_id)
            .maybeSingle(); 
            
          const balanceBefore = wallet?.balance || 0;
          const fundingAmount = updatedPayment.amount || 0;
          const balanceAfter = balanceBefore + fundingAmount;

          // Update Wallet Balance
          await supabaseAdmin!
            .from('wallets')
            .update({ 
              balance: balanceAfter,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', updatedPayment.user_id);

          // 🔥 Use UPSERT with provider_tx_id to prevent duplicates from webhook retries
          await supabaseAdmin!
            .from('wallet_transactions')
            .upsert({
              user_id: updatedPayment.user_id,
              email: customerEmail,
              reference: ref, 
              transaction_type: 'INFLOW',
              funding_method: 'PAYSTACK_CARD', // Matches your SQL constraint
              amount: fundingAmount,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              status: 'SUCCESS',
              provider_tx_id: `PAYSTACK-${ref}`, // 🔥 The "Marriage" key
              source: 'PAYSTACK',                // 🔥 The "Marriage" source
              created_at: event.data.paid_at || new Date().toISOString(),
              receiver_info: { 
                wallet_name: wallet?.account_name || "WDC Wallet", 
                account_number: wallet?.account_number || "Virtual" 
              }
            }, { onConflict: 'provider_tx_id' });
          
        } 
        // ====================================================
        // 👉 SCENARIO B: STANDARD REGISTRATION
        // ====================================================
        else {
          await supabaseAdmin!
            .from('users')
            .update({ has_completed_onboarding: true }) 
            .eq('auth_id', updatedPayment.user_id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}