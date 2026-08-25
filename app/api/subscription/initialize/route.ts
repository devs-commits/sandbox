import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

type PlanType = "monthly" | "quarterly";

type InitializeBody = {
  email?: string;
  amount?: number | string;
  callback_url?: string;
  userId?: string;
  fullName?: string;
  track?: string;
  role?: string;
  subscriptionPlan?: string;
  planType?: string;
  plan?: string;
};

// 🚨 Ensure these Plan Codes actually exist on your Paystack Dashboard!
const PLAN_CONFIG: Record<PlanType, { amountInNaira: number; code: string }> = {
  monthly: {
    amountInNaira: 15000,
    code: process.env.PAYSTACK_PLAN_MONTHLY || "PLN_46z8gz0p4foduy8",
  },
  quarterly: {
    amountInNaira: 40500,
    code: process.env.PAYSTACK_PLAN_QUARTERLY || "PLN_ddzhasixy441mju",
  },
};

const isPlanType = (value: string): value is PlanType =>
  value === "monthly" || value === "quarterly";

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
};

const getCallbackUrl = (requestedCallback?: string) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://labs.wdc.ng";
  const defaultCallback = new URL("/auth/verify-email", appUrl).toString();

  if (!requestedCallback) return defaultCallback;

  try {
    const requestedUrl = new URL(requestedCallback);
    if (requestedUrl.origin === new URL(appUrl).origin) return requestedUrl.toString();
    if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(requestedUrl.hostname)) {
      return requestedUrl.toString();
    }
  } catch {
    // Ignore invalid URLs
  }
  return defaultCallback;
};

export async function POST(request: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("❌ [Init Route] PAYSTACK_SECRET_KEY is missing in ENV.");
      return NextResponse.json({ status: false, error: "Paystack is not configured." }, { status: 500 });
    }

    const body = (await request.json()) as InitializeBody;
    console.log("📥 [Init Route] Received Payload:", body);

    const email = body.email?.trim().toLowerCase();
    const rawPlan = (body.subscriptionPlan || body.planType || body.plan || "").trim().toLowerCase();

    // 1. Validate Email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      console.error("❌ [Init Route] Validation Failed: Invalid Email ->", email);
      return NextResponse.json({ status: false, error: "A valid email address is required." }, { status: 400 });
    }

    // 2. Validate Plan Name
    if (!isPlanType(rawPlan)) {
      console.error("❌ [Init Route] Validation Failed: Invalid Plan ->", rawPlan);
      return NextResponse.json({ status: false, error: "Choose a valid plan: 'monthly' or 'quarterly'." }, { status: 400 });
    }

    const selectedPlan = PLAN_CONFIG[rawPlan];

    // 3. Authenticate User
    const accessToken = getBearerToken(request);
    let authenticatedUserId: string | null = null;

    if (accessToken) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      if (authError || !user) {
        console.error("❌ [Init Route] Auth Failed: Invalid Token.");
        return NextResponse.json({ status: false, error: "Your session is invalid. Please log in again." }, { status: 401 });
      }
      authenticatedUserId = user.id;
    }

    const dbUserId = authenticatedUserId || body.userId;
    const callbackUrl = getCallbackUrl(body.callback_url);

    // 4. Send to Paystack
    const paystackPayload = {
      email,
      amount: selectedPlan.amountInNaira * 100, // Paystack uses Kobo
      plan: selectedPlan.code,
      callback_url: callbackUrl,
      metadata: {
        user_id: dbUserId || null,
        subscriptionPlan: rawPlan,
        payment_source: "signup_subscription",
      },
    };

    console.log("📤 [Init Route] Sending to Paystack API:", paystackPayload);

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    // 5. Handle Paystack Rejections (This is likely where your 400 is coming from)
    if (!paystackResponse.ok || !paystackData.status) {
      console.error("❌ [Init Route] Paystack API Rejected Request:", paystackData);
      return NextResponse.json(
        { status: false, error: paystackData.message || "Paystack could not initialize the payment." },
        { status: paystackResponse.ok ? 400 : paystackResponse.status },
      );
    }

    // 6. Save Pending Payment to DB
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      email,
      role: body.role || "student",
      amount: selectedPlan.amountInNaira,
      subscription_plan: rawPlan,
      payment_method: "paystack",
      payment_status: "pending",
      reference: paystackData.data.reference,
      user_id: dbUserId || null,
    });

    if (paymentError) {
      console.error("❌ [Init Route] DB Insert Failed:", paymentError.message);
    }

    console.log("✅ [Init Route] Success! Returning checkout URL.");
    return NextResponse.json(paystackData);

  } catch (error: any) {
    console.error("🔥 [Init Route] Fatal Error:", error?.message || error);
    return NextResponse.json({ status: false, error: "Payment initialization failed." }, { status: 500 });
  }
}