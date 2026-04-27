import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Must use Admin client to bypass Row Level Security when updating secure fields like BVN/NIN
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, bvn, nin } = await req.json();

    if (!userId || (!bvn && !nin)) {
      return NextResponse.json({ success: false, error: "Missing required KYC fields" }, { status: 400 });
    }

    console.log(`🔍 Verifying KYC for user ${userId}...`);

    // 1. Send to Supply Smart (Based on your WhatsApp screenshot)
    const response = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/kyc/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PAYMENT_API_KEY!,
        'merchant-id': process.env.PAYMENT_MERCHANT_ID!
      },
      body: JSON.stringify({ 
        bvn: bvn || "", 
        nin: nin || "" 
      })
    });

    // Protect against HTML error pages
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("❌ KYC Provider HTML Error:", errorText.slice(0, 150));
      return NextResponse.json({ success: false, error: "Verification provider temporarily unavailable" }, { status: 502 });
    }

    const data = await response.json();

    // 2. Check Supply Smart Response (Adjust 'data.success' if their payload structure differs)
    if (data.status === false || data.success === false) {
      return NextResponse.json({ 
        success: false, 
        error: data.message || "Identity verification failed. Please check your details." 
      }, { status: 400 });
    }

    // 3. Save to Supabase (Matching your database columns exactly)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        bvn: bvn || null,
        nin: nin || null,
        id_verified: true, // Unlocks wallet creation and withdrawals
      })
      .eq('auth_id', userId);

    if (dbError) throw dbError;

    console.log(`✅ KYC Verified & Saved for user ${userId}`);
    return NextResponse.json({ success: true, message: "Identity verified successfully" });

  } catch (error: any) {
    console.error("🔥 KYC API Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}