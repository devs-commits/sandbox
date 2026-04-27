import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { reference, userId } = await req.json();
    console.log("💳 Verifying Paystack Ref for Direct Subscription:", reference);

    // 1. Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json({ success: false, message: "Paystack verification failed" }, { status: 400 });
    }

    // Extract the metadata passed during initialization
    const metadata = paystackData.data.metadata || {};

    // ====================================================
    // 🌟 ONLY ROUTE: DIRECT SUBSCRIPTION PAYMENT
    // ====================================================
    // We now strictly use Paystack for Direct Subscriptions, NOT Wallet Funding.
    
    // Default to 'monthly' if for some reason it wasn't passed, though it always should be now
    const plan = metadata.subscriptionPlan || 'monthly';
    const daysToAdd = plan === 'quarterly' ? 90 : 30;
    
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + daysToAdd);

    // 2. Update the User's Office Access
    const { error: userError } = await supabaseAdmin!
      .from('users')
      .update({
        has_completed_onboarding: true,
        subscription_status: 'active',
        subscription_expires_at: expiryDate.toISOString(),
        last_payment_date: today.toISOString(),
        start_date: today.toISOString(),
        renewal_status: 'pending',
        subscription_plan: plan
      })
      .eq('auth_id', userId);

    if (userError) throw userError;

    // 3. Mark the 'payments' table record as successful
    await supabaseAdmin!
      .from('payments')
      .update({ payment_status: 'success' })
      .eq('reference', reference);

    console.log(`✅ Paystack Subscription (${plan}) fully completed and logged. Office Unlocked.`);
    
    // Notice we DO NOT touch the wallet_transactions table here anymore.
    return NextResponse.json({ success: true, message: "Subscription activated" });

  } catch (err: any) {
    console.error("🔥 Paystack Verify Crash:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}