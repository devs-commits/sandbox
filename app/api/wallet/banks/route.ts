import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/financial-institution`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      },
    });

    const textResponse = await response.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error("❌ Banks API Parse Error:", textResponse);
      return NextResponse.json({ error: "Invalid response from provider" }, { status: 502 });
    }

    if (response.ok && data.success) {
      // Sort banks alphabetically for a better user experience
      const banks = data.data.sort((a: any, b: any) => 
        a.institutionName.localeCompare(b.institutionName)
      );
      return NextResponse.json({ success: true, banks });
    }

    return NextResponse.json({ error: data?.message || "Failed to fetch banks" }, { status: response.status });
  } catch (error: any) {
    console.error("🔥 Banks API Route Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}