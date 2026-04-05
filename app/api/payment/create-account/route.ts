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
    const { fullName, email, track, role, userId } = await req.json();
    const amount = role === "recruiter" ? PRICE_MAP["recruiter"] : PRICE_MAP[track] || 15000;

    const names = fullName.trim().split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";

    // 🔥 THE FIX: Abandoned Cart Recovery - Lookup user if frontend sends null
    let dbUserId = userId; 
    if (!dbUserId && email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('auth_id')
        .eq('email', email)
        .single();
      
      dbUserId = existingUser?.auth_id || null;
    }

    // ==========================================
    // 1. REUSE CHECK (TRANSFER ONLY)
    // ==========================================
    // Check if they already have an active, unexpired Transfer account
    const { data: existing } = await supabase
      .from("payments")
      .select("*")
      .eq("email", email)
      .eq("payment_method", "transfer") // 🔥 Only look for transfers
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

    // ==========================================
    // 2. FETCH FROM SUPPLY SMART
    // ==========================================
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
    
    // Generate a fallback reference if Supply Smart doesn't provide one
    const reference = account.reference || `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ==========================================
    // 3. INSERT NEW PENDING TRANSFER
    // ==========================================
    // We use INSERT so every payment attempt is logged, allowing users to switch 
    // seamlessly between Paystack and Transfer without overwriting data.
    const { data: newPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: dbUserId, // 🔥 Updated here to link to their users table profile reliably
        email, 
        full_name: fullName,
        track: role === "student" ? track : "recruiter",
        role,
        amount,
        account_number: account.accountNumber,
        account_name: account.accountName,
        expiry: expiryValue,
        payment_method: "transfer", // 🔥 Identifies this as a Supply Smart transaction
        payment_status: "pending", 
        reference: reference
      })
      .select().single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      transactionId: newPayment.id,
      expiry: expiryValue
    });

  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}