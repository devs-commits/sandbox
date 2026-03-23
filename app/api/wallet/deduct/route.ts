import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // make sure this path is correct

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount } = body;

    // Fetch user
    const { data: user, error } = await supabase
      .from("users")
      .select("wallet_balance, bank_name, account_number")
      .eq("auth_id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check balance
    if (user.wallet_balance < amount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    /*
      Call payout API here
    */

    // Update wallet
    await supabase
      .from("users")
      .update({
        wallet_balance: user.wallet_balance - amount,
      })
      .eq("auth_id", userId);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}