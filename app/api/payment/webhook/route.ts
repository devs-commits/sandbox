import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    console.log("SUPPLY SMART WEBHOOK:", body);

    /*
    [Unverified] Payload structure — confirm from logs
    */

    const accountNumber =
      body.accountNumber ||
      body.data?.accountNumber;

    const amount =
      body.amount ||
      body.data?.amount;

    if (!accountNumber || !amount) {
      console.log("Invalid webhook payload");
      return NextResponse.json({ received: true });
    }

    /*
    Find user
    */

    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance, auth_id")
      .eq("account_number", accountNumber)
      .single();

    if (!user) {
      console.log("User not found for account:", accountNumber);
      return NextResponse.json({ received: true });
    }

    /*
    Update balance
    */

    const newBalance = (user.wallet_balance || 0) + Number(amount);

    await supabase
      .from("users")
      .update({
        wallet_balance: newBalance
      })
      .eq("auth_id", user.auth_id);

    console.log("Wallet credited:", newBalance);

    return NextResponse.json({ success: true });

  } catch (err) {

    console.error("WEBHOOK ERROR:", err);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}