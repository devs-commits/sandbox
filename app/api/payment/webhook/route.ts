import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDepositEmail } from "@/lib/zeptomail"; // 🔥 Added import

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    console.log("SUPPLY SMART WEBHOOK:", body);

    const accountNumber = body.accountNumber || body.data?.accountNumber;
    const amount = body.amount || body.data?.amount;

    if (!accountNumber || !amount) {
      console.log("Invalid webhook payload");
      return NextResponse.json({ received: true });
    }

    // ==========================================
    // 1. UPDATE THE PAYMENTS TABLE
    // This allows the frontend poller and finalize route to see 'confirmed'
    // ==========================================
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .update({ 
        payment_status: "confirmed", 
        confirmed_at: new Date().toISOString() 
      })
      .eq("account_number", accountNumber)
      .eq("payment_status", "pending") // Only update if it was pending
      .select("user_id, email, full_name")
      .single();

    if (paymentError || !paymentRecord) {
      console.log("No pending payment found for account:", accountNumber);
      // We continue anyway to credit the wallet if the user exists
    }

    // ==========================================
    // 2. FIND USER & UPDATE WALLET
    // ==========================================
    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance, auth_id, email, full_name")
      .eq("account_number", accountNumber)
      .single();

    if (!user) {
      console.log("User not found for account:", accountNumber);
      return NextResponse.json({ received: true });
    }

    const newBalance = (user.wallet_balance || 0) + Number(amount);

    const { error: updateError } = await supabase
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("auth_id", user.auth_id);

    if (updateError) throw updateError;

    console.log("Wallet credited:", newBalance);

    // ==========================================
    // 3. TRIGGER DEPOSIT EMAIL (ZEPTOMAIL)
    // ==========================================
    // We use the data from the user profile for the email
    await sendDepositEmail(
      user.email, 
      user.full_name, 
      Number(amount), 
      newBalance, 
      `TRF-${accountNumber}-${Date.now().toString().slice(-4)}`
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}