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

    // The Postman screenshot confirms this base is the one hosting /signupfee
    const baseUrl = process.env.PAYMENT_BASE_URL?.replace(/\/+$/, ""); 
    
    if (!baseUrl || !process.env.PAYMENT_API_KEY) {
      return NextResponse.json({ success: false, message: "Server configuration missing" }, { status: 500 });
    }

    let amount = role === "recruiter" ? PRICE_MAP["recruiter"] : PRICE_MAP[track] || 15000;
    if (subscriptionPlan === 'quarterly') amount = 45000;

    const names = fullName?.trim().split(" ") || ["User"];
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "Intern";

    // 1. ACTIVE ACCOUNT CHECK
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('auth_id, has_completed_onboarding')
        .eq('email', email)
        .maybeSingle();

      if (existingUser?.has_completed_onboarding) {
        return NextResponse.json({ 
          success: false, 
          message: "Account active. Please login to renew." 
        }, { status: 409 });
      }
    }

    // 2. REUSE PENDING PAYMENT CHECK
    const { data: existing } = await supabase
      .from("payments")
      .select("*")
      .eq("email", email)
      .eq("payment_method", "transfer")
      .gt("expiry", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        accountNumber: existing.account_number, 
        accountName: existing.account_name, 
        transactionId: existing.id, 
        expiry: existing.expiry 
      });
    }

    // 3. TARGET THE WORKING ENDPOINT
    // Postman: POST https://lab-api.wdc.ng/api/v1/signupfee
    const response = await fetch(`${baseUrl}/signupfee`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-api-key": process.env.PAYMENT_API_KEY!, 
        "merchant-id": process.env.PAYMENT_MERCHANT_ID! 
      },
      body: JSON.stringify({ 
        firstName, 
        lastName, 
        amount: String(amount) 
      })
    });

    const resData = await response.json();
    
    // Mapping from Postman result: resData.data.accountNumber
    const account = resData?.data;

    if (!resData.success || !account?.accountNumber) {
      return NextResponse.json({ 
        success: false, 
        message: resData.message || "Failed to generate payment details" 
      }, { status: 400 });
    }

    const expiryValue = account.expiryDateTime || new Date(Date.now() + 900000).toISOString();
    const reference = account.reference || `TRF-${Date.now()}`;

    // 4. SAVE AND RETURN
    const { data: newPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        email, 
        full_name: fullName, 
        track: role === "student" ? track : "recruiter", 
        role, 
        amount, 
        account_number: account.accountNumber, 
        account_name: account.accountName, 
        expiry: expiryValue,
        payment_method: "transfer", 
        payment_status: "pending", 
        reference: reference
      })
      .select().single();

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      accountNumber: account.accountNumber, 
      accountName: account.accountName, 
      transactionId: newPayment.id, 
      expiry: expiryValue 
    });

  } catch (error: any) {
    console.error("Signup Fee Error:", error.message);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}