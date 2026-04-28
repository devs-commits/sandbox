import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { bankCode, accountNumber } = await req.json();

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "bankCode and accountNumber are required" }, { status: 400 });
    }

    // Using STANDALONE_PAYMENT_BASE_URL for Cloudfront, falling back to standard if needed
    const baseUrl = process.env.STANDALONE_PAYMENT_BASE_URL || process.env.PAYMENT_BASE_URL;

    const response = await fetch(`${baseUrl}/partners/nameenquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      },
      body: JSON.stringify({ bankCode, accountNumber }),
    });

    const textResponse = await response.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error("❌ Name Enquiry Parse Error:", textResponse);
      return NextResponse.json({ error: "Invalid response from provider" }, { status: 502 });
    }

    if (response.ok && data?.success) {
      const resultData = data.data || {};
      
      return NextResponse.json({ 
        success: true, 
        accountName: resultData.accountName,
        // 🔥 CRITICAL ADDITION: The withdrawal encryption step requires this!
        sessionId: resultData.sessionID || resultData.sessionId || resultData.nameEnquiryRef 
      });
    }

    return NextResponse.json({ error: data?.message || "Verification failed" }, { status: 400 });
  } catch (error: any) {
    console.error("🔥 Name Enquiry API Route Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}