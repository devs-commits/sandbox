import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin"; // Use Admin for sensitive deducts

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, reference, description } = await req.json(); // Pass reference from frontend or generate it

    // 1. Fetch user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("wallet_balance")
      .eq("auth_id", userId)
      .single();

    if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if ((user.wallet_balance || 0) < amount) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    /* TODO: Call Payout API (Supply Smart) here if needed */

    // 2. Update wallet
    const newBalance = user.wallet_balance - amount;
    await supabaseAdmin.from("users").update({ wallet_balance: newBalance }).eq("auth_id", userId);

    // 3. Log Transaction (Ledger)
    await supabaseAdmin.from("transactions").insert({
      auth_id: userId,
      amount: amount,
      type: 'debit',
      source: 'system',
      reference: reference || `WDC-DED-${Date.now()}`,
      description: description || 'Wallet Deduction',
    });

    return NextResponse.json({ success: true, newBalance });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}