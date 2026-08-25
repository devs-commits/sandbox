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

// Replaced `unknown` with concrete scalar types
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

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

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
    const configuredOrigin = new URL(appUrl).origin;

    if (requestedUrl.origin === configuredOrigin) {
      return requestedUrl.toString();
    }

    if (
      process.env.NODE_ENV === "development" &&
      ["localhost", "127.0.0.1"].includes(requestedUrl.hostname)
    ) {
      return requestedUrl.toString();
    }
  } catch {
    // Fallback to default if invalid URL is provided
  }

  return defaultCallback;
};

export async function POST(request: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { status: false, error: "Paystack is not configured on the server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as InitializeBody;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim() || "";
    const track = body.track?.trim() || "";
    const role = body.role?.trim() || "student";
    
    const rawPlan = (body.subscriptionPlan || body.planType || body.plan || "").trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { status: false, error: "A valid email address is required." },
        { status: 400 },
      );
    }

    if (!isPlanType(rawPlan)) {
      return NextResponse.json(
        { status: false, error: "Choose a valid plan: 'monthly' or 'quarterly'." },
        { status: 400 },
      );
    }

    const plan = rawPlan;
    const selectedPlan = PLAN_CONFIG[plan];
    const suppliedAmount = Number(body.amount);

    if (body.amount && Number.isFinite(suppliedAmount) && suppliedAmount !== selectedPlan.amountInNaira) {
      return NextResponse.json(
        { status: false, error: "The payment amount does not match the selected plan." },
        { status: 400 },
      );
    }

    const accessToken = getBearerToken(request);
    let authenticatedUserId: string | null = null;

    if (accessToken) {
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (authError || !user) {
        return NextResponse.json(
          { status: false, error: "Your session is invalid. Please log in again." },
          { status: 401 },
        );
      }

      if (user.email?.toLowerCase() !== email) {
        return NextResponse.json(
          { status: false, error: "The payment email does not match the signed-in account." },
          { status: 403 },
        );
      }

      authenticatedUserId = user.id;
    }

    const userQuery = supabaseAdmin
      .from("users")
      .select("auth_id, full_name, email, track, role")
      .limit(1);

    const { data: existingUsers, error: userLookupError } = authenticatedUserId
      ? await userQuery.eq("auth_id", authenticatedUserId)
      : await userQuery.eq("email", email);

    if (userLookupError) {
      console.error("Paystack user lookup failed:", userLookupError.message);
    }

    const existingUser = existingUsers?.[0] || null;
    const dbUserId = existingUser?.auth_id || authenticatedUserId || body.userId;
    const callbackUrl = getCallbackUrl(body.callback_url);

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: selectedPlan.amountInNaira * 100, // Paystack uses kobo
          plan: selectedPlan.code,
          callback_url: callbackUrl,
          metadata: {
            ...(dbUserId ? { user_id: dbUserId } : {}),
            subscriptionPlan: plan,
            planType: plan,
            subscription_plan: plan,
            payment_source: "signup_subscription",
            custom_fields: [
              {
                display_name: "Subscription Plan",
                variable_name: "subscription_plan",
                value: plan,
              },
              {
                display_name: "Account Role",
                variable_name: "role",
                value: existingUser?.role || role,
              },
            ],
          },
        }),
      },
    );

    const paystackData = (await paystackResponse.json()) as PaystackInitializeResponse;

    if (!paystackResponse.ok || !paystackData.status || !paystackData.data) {
      return NextResponse.json(
        {
          status: false,
          error: paystackData.message || "Paystack could not initialize the payment.",
        },
        { status: paystackResponse.ok ? 400 : paystackResponse.status },
      );
    }

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      email,
      full_name: existingUser?.full_name || fullName || null,
      track: existingUser?.track || track || null,
      role: existingUser?.role || role,
      amount: selectedPlan.amountInNaira,
      subscription_plan: plan,
      payment_method: "paystack",
      payment_status: "pending",
      reference: paystackData.data.reference,
      user_id: dbUserId || null,
    });

    if (paymentError) {
      console.error("Payment audit insert failed:", paymentError.message);
      return NextResponse.json(
        {
          status: false,
          error: "The checkout was initialized, but its payment record could not be created. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(paystackData);
  } catch (error: any) {
    console.error("Paystack initialization error:", error?.message || error);
    return NextResponse.json(
      { status: false, error: "Payment initialization failed." },
      { status: 500 },
    );
  }
}