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
    const { fullName, email, track, role } = await req.json();
    const amount = role === "recruiter" ? PRICE_MAP["recruiter"] : PRICE_MAP[track] || 15000;

    const names = fullName.trim().split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";

    // Reuse check for identical user identity
    const { data: existing } = await supabase
      .from("payments")
      .select("*")
      .eq("email", email)
      .eq("full_name", fullName)
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

    const response = await fetch(
      `${process.env.PAYMENT_BASE_URL}/partners/dynamic/account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PAYMENT_API_KEY!,
          "merchant-id": process.env.PAYMENT_MERCHANT_ID!
        },
        body: JSON.stringify({ firstName, lastName, amount: amount.toString() })
      }
    );

    const data = await response.json();
    const account = data?.data?.result?.data || data?.result?.data || data?.data || data;

    if (!account?.accountNumber) {
      return NextResponse.json({ success: false, message: "Service temporarily unavailable" }, { status: 400 });
    }

    const expiryValue = account.expiryDateTime || account.expiry || new Date(Date.now() + 900000).toISOString();

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
        expiry: expiryValue
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

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}