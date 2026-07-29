import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get("accountNumber");

    if (!accountNumber) {
      return NextResponse.json({ success: false, message: "Account number missing" }, { status: 400 });
    }

    // 🔥 Using STANDALONE to prevent the routing loop!
    const baseUrl = process.env.PAYMENT_BASE_URL?.replace(/\/+$/, "");
    
    if (!baseUrl || !process.env.PAYMENT_API_KEY) {
      return NextResponse.json({ success: false, message: "Server configuration missing" }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/virtual-wallet?accountNumber=${accountNumber}&page=1&limit=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!
      }
    });

    const resData = await response.json();

    // 🎯 Mapping exactly to your JSON: data.result[0].availableBalance
    const balance = resData?.data?.result?.[0]?.availableBalance || 0;

    return NextResponse.json({ success: true, balance });

  } catch (error: any) {
    console.error("Balance Fetch Error:", error.message);
    return NextResponse.json({ success: false, message: "Failed to fetch live balance" }, { status: 500 });
  }
}