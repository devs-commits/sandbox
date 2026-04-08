import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { bankCode, accountNumber } = await req.json();

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "bankCode and accountNumber are required" }, { status: 400 });
    }

    const response = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/nameenquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      },
      body: JSON.stringify({ bankCode, accountNumber }),
    });

    const data = await response.json();

    if (response.ok && data?.success) {
      return NextResponse.json({ success: true, accountName: data.data.accountName });
    }

    return NextResponse.json({ error: data?.message || "Verification failed" }, { status: 404 });
  } catch (error: any) {
    console.error("🔥 Name Enquiry API Route Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}