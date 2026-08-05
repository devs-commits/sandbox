import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// Live Plan Codes (Make sure these match your Paystack Live Dashboard)
const PLAN_CODES: Record<string, { code: string; amountInKobo: number }> = {
  MONTHLY: {
    code: process.env.PAYSTACK_PLAN_MONTHLY || "PLN_46z8gz0p4foduy8",
    amountInKobo: 1500000, // ₦15,000
  },
  QUARTERLY: {
    code: process.env.PAYSTACK_PLAN_QUARTERLY || "PLN_ddzhasixy441mju",
    amountInKobo: 4050000, // ₦40,500
  },
};

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    if (!userId || !email || !plan || !PLAN_CODES[plan]) {
      return NextResponse.json({ error: "Invalid parameters. Choose MONTHLY or QUARTERLY." }, { status: 400 });
    }

    const selectedPlan = PLAN_CODES[plan];

    // Initialize transaction with Paystack passing the exact PLAN code
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: selectedPlan.amountInKobo,
        plan: selectedPlan.code, // 🔥 Paystack automatically attaches this card to the subscription plan!
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://labs.wdc.ng"}/student/dashboard?payment=success`,
        metadata: {
          user_id: userId,
          subscription_plan: plan,
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: userId },
            { display_name: "Plan", variable_name: "subscription_plan", value: plan }
          ]
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || "Failed to initialize payment" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (error: any) {
    console.error("Subscription Init Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}