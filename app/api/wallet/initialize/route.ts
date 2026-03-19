import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {

    const { userId } = await req.json();

    // ENV safety
    if (
      !process.env.PAYMENT_BASE_URL ||
      !process.env.PAYMENT_API_KEY ||
      !process.env.PAYMENT_MERCHANT_ID
    ) {
      console.error("Missing Supply Smart env variables");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // check if wallet already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("account_number")
      .eq("auth_id", userId)
      .single();

    if (existingUser?.account_number) {
      return NextResponse.json({
        success: true,
        accountNumber: existingUser.account_number,
      });
    }

    // get user
    const { data: user } = await supabase
      .from("users")
      .select("full_name, nin, bvn")
      .eq("auth_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.nin || !user.bvn) {
      return NextResponse.json(
        { error: "NIN and BVN required" },
        { status: 400 }
      );
    }

    const names = (user.full_name || "User").split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";

    // API call
    const response = await fetch(
      `${process.env.PAYMENT_BASE_URL}/partners/virtual/account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.PAYMENT_API_KEY!,
          "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          partnerName: "WDC Digital Centre",
          nin: user.nin,
          bvn: user.bvn,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Supply Smart error:", result);
      return NextResponse.json({ error: "Failed to create wallet" }, { status: 500 });
    }

    const account = result?.data?.result;

    if (!account || !account.accountNumber) {
      console.error("Invalid account response:", result);
      return NextResponse.json({ error: "Invalid wallet response" }, { status: 500 });
    }

    // save
    await supabase
      .from("users")
      .update({
        account_number: account.accountNumber,
        account_name: account.accountName,
        wallet_id: account.walletId,
        bank_name: "Parallex Bank",
        wallet_created: true,
      })
      .eq("auth_id", userId);

    return NextResponse.json({
      success: true,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
    });

  } catch (err) {
    console.error("INIT WALLET ERROR:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}