import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processReferralCommission } from "@/lib/commissionEngine"; // 🔥 Added Import

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body;
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

    // Extract the metadata passed during initialization or inline setup
    const metadata = paystackData.data.metadata || {};

    // 🔥 Bulletproof User ID check: Use body.userId, fallback to metadata.user_id
    const finalUserId = body.userId || metadata.user_id;

    if (!finalUserId) {
      console.error("❌ Paystack Verify Error: No User ID found in request or metadata.");
      return NextResponse.json({ success: false, message: "User ID missing from payment data" }, { status: 400 });
    }

    // Default to 'monthly' if missing
    const plan = metadata.subscriptionPlan || 'monthly';
    const daysToAdd = plan === 'quarterly' ? 90 : 30;
    
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + daysToAdd);

    // 2. Update the User's Office Access AND return their numeric DB ID
    const { data: userData, error: userError } = await supabaseAdmin!
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
      .eq('auth_id', finalUserId) // Use the bulletproof ID
      .select('id') 
      .single();

    if (userError) throw userError;

    // 3. Handle the 'payments' table safely for BOTH flows
    const amountPaid = paystackData.data.amount / 100; // Exact Naira value
    
    // Check if a pending payment was created by the Initialize route
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();

    if (existingPayment) {
      // Flow A (SubscribeModal): Update existing pending record
      await supabaseAdmin!
        .from('payments')
        .update({ payment_status: 'success' })
        .eq('reference', reference);
    } else {
      // Flow B (Office Inline): Insert the new payment record directly
      await supabaseAdmin!
        .from('payments')
        .insert({
          email: paystackData.data.customer.email,
          role: "student",
          amount: amountPaid,
          subscription_plan: plan,
          payment_method: "paystack",
          payment_status: "success",
          reference: reference,
          user_id: finalUserId
        });
    }

    console.log(`✅ Paystack Subscription (${plan}) fully completed and logged. Office Unlocked.`);
    
    // 4. TRIGGER COMMISSION ENGINE
    if (userData?.id) {
      await processReferralCommission(userData.id, amountPaid);
    }

    return NextResponse.json({ success: true, message: "Subscription activated" });

  } catch (err: any) {
    console.error("🔥 Paystack Verify Crash:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}