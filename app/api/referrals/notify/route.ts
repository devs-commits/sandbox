// app/api/referrals/notify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReferralPendingEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { referrerId, referredName } = await req.json();

    if (!referrerId) {
      return NextResponse.json({ error: "Missing referrer ID" }, { status: 400 });
    }

    // 1. Get the referrer's details (so we know who to email)
    const { data: referrer, error } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('auth_id', referrerId)
      .single();

    if (error || !referrer || !referrer.email) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    // 2. Send the pending email
    await sendReferralPendingEmail(
      referrer.email,
      referrer.full_name || "Partner",
      referredName || "A new user"
    );

    return NextResponse.json({ success: true, message: "Referral notification sent" });

  } catch (error) {
    console.error("Referral Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}