import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    // 1. Fetch the user's email from Supabase
    const { data: user, error: dbError } = await supabaseAdmin
      .from("users")
      .select("paystack_customer_code, email")
      .eq("auth_id", userId)
      .single();

    if (dbError || !user || !user.email) {
      throw new Error("Could not fetch user billing profile.");
    }

    // 2. FETCH CUSTOMER ID FROM PAYSTACK
    const customerRes = await fetch(`https://api.paystack.co/customer/${user.email}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const customerData = await customerRes.json();

    if (!customerRes.ok || !customerData.data) {
      throw new Error("Could not find this customer in Paystack. Have they made a payment yet?");
    }

    const paystackCustomerId = customerData.data.id;

    // 3. Ask Paystack for this exact customer's subscriptions using their ID
    const subRes = await fetch(`https://api.paystack.co/subscription?customer=${paystackCustomerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const subData = await subRes.json();

    if (!subRes.ok || !subData.data || subData.data.length === 0) {
      throw new Error("No active subscriptions found on Paystack for this account.");
    }

    // 4. Find the most recent active (or valid) subscription
    const activeSub = subData.data.find((sub: any) => sub.status === 'active') || subData.data[0];

    if (!activeSub || !activeSub.subscription_code) {
      throw new Error("Could not find a valid subscription code.");
    }

    // 5. GENERATE THE MANAGEMENT LINK (The Missing Step!)
    // We must pass the subscription_code back to Paystack to generate the secure URL
    const linkRes = await fetch(`https://api.paystack.co/subscription/${activeSub.subscription_code}/manage/link`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok || !linkData.data || !linkData.data.link) {
      throw new Error("Could not generate a management link. Subscription may be cancelled or invalid.");
    }

    // 6. Return the magic Paystack portal URL to the frontend
    return NextResponse.json({ success: true, url: linkData.data.link });

  } catch (error: any) {
    console.error("Manage Subscription Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}