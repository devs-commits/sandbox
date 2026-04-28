import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, transactionId } = body;

    if (!userId || !transactionId) {
      return NextResponse.json({ error: "Missing userId or transactionId" }, { status: 400 });
    }

    // 1. Link payment and fetch amount for plan calculation
    const { data: paymentInfo, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({
         user_id: userId,
         payment_status: "paid"
      })
      .eq("id", transactionId)
      .select("amount")
      .single();

    if (paymentError) {
      console.error("Database Error (Payments):", paymentError.message);
      return NextResponse.json({ error: "Failed to link payment" }, { status: 500 });
    }

    // 2. CALCULATE DATES: 15k = 30 days, 45k = 90 days
    const amountPaid = paymentInfo?.amount || 15000;
    const daysToAdd = amountPaid >= 45000 ? 90 : 30;
    const planName = amountPaid >= 45000 ? "quarterly" : "monthly";

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + daysToAdd);

    // 3. Activate User with precise timestamps
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ 
        subscription_status: "active",
        subscription_plan: planName,
        start_date: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString(),
        is_complete: true, 
        has_completed_onboarding: true 
      })
      .eq("auth_id", userId);

    if (userError) {
      console.error("Database Error (Users):", userError.message);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("FINALIZE ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}