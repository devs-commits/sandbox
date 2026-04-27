import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICE_MAP: Record<string, number> = {
  "digital-marketing": 15000,
  "data-analytics": 15000,
  "cyber-security": 15000,
  "recruiter": 15000
};

export async function POST(req: Request) {
  try {
    const { fullName, email, track, role, subscriptionPlan } = await req.json();

    let baseUrl = process.env.PAYMENT_BASE_URL?.trim() || "";
    if (baseUrl && !baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
    baseUrl = baseUrl.replace(/\/+$/, ""); 

    if (!baseUrl || !process.env.PAYMENT_API_KEY) {
      return NextResponse.json({ success: false, message: "Server configuration missing" }, { status: 500 });
    }

    let amount = role === "recruiter" ? PRICE_MAP["recruiter"] : PRICE_MAP[track] || 15000;
    if (subscriptionPlan === 'quarterly') amount = 45000;

    const names = fullName?.trim().split(" ") || ["User"];
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "Intern";

    // 🛑 BLOCK ACTIVE ACCOUNTS BEFORE THEY PAY
    let dbUserId = null;
    if (email) {
      const { data: existingUser } = await supabase.from('users').select('auth_id, has_completed_onboarding').eq('email', email).maybeSingle();
      if (existingUser) {
        if (existingUser.has_completed_onboarding) {
           return NextResponse.json({ success: false, message: "This email is already active. Please login to renew." }, { status: 409 });
        }
        dbUserId = existingUser.auth_id; // Let abandoned carts try again
      }
    }

    // REUSE CHECK
    const { data: existing } = await supabase
      .from("payments")
      .select("*")
      .eq("email", email)
      .eq("payment_method", "transfer")
      .gt("expiry", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, accountNumber: existing.account_number, accountName: existing.account_name, transactionId: existing.id, expiry: existing.expiry });
    }

    // FETCH FROM SUPPLY SMART
    const apiPath = baseUrl.includes('/api/v1') ? '/signupfee' : '/api/v1/signupfee';
    
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-api-key": process.env.PAYMENT_API_KEY!, 
        "merchant-id": process.env.PAYMENT_MERCHANT_ID! 
      },
      // 🔥 THE FIX: Removed 'email' and 'description' to prevent schema rejection
      body: JSON.stringify({ 
        firstName, 
        lastName, 
        amount: String(amount) 
      })
    }).catch(err => {
      console.error("🚨 DNS Error:", err.message);
      return null;
    });

    if (!response) return NextResponse.json({ success: false, message: "Payment gateway unreachable." }, { status: 502 });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) return NextResponse.json({ success: false, message: "Gateway error" }, { status: 502 });

    const resData = await response.json();
    const account = resData?.data;

    if (!resData.success || !account?.accountNumber) {
      return NextResponse.json({ success: false, message: resData.message || "Failed to generate account" }, { status: 400 });
    }

    const expiryValue = account.expiryDateTime || new Date(Date.now() + 900000).toISOString();
    const reference = account.reference || `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // INSERT (userId will be NULL for brand new checkouts, which is correct)
    const { data: newPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: dbUserId, email, full_name: fullName, track: role === "student" ? track : "recruiter", role, amount, 
        account_number: account.accountNumber, account_name: account.accountName, expiry: expiryValue,
        payment_method: "transfer", payment_status: "pending", reference: reference
      })
      .select().single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, accountNumber: account.accountNumber, accountName: account.accountName, transactionId: newPayment.id, expiry: expiryValue });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}