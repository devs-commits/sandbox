import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client to bypass RLS for this specific secure check
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, newReferralCode } = await req.json();

    if (!userId || !newReferralCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if the user has ALREADY customized their code
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("has_customized_referral")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    if (user.has_customized_referral) {
      return NextResponse.json({ 
        error: "You have already customized your referral code. This action can only be done once." 
      }, { status: 403 }); // 403 Forbidden
    }

    // 2. Attempt to update the code AND lock the boolean to true
    // If the code is taken, the UNIQUE constraint we added in the DB will throw an error here automatically
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ 
        referral_code: newReferralCode.toLowerCase().trim(),
        has_customized_referral: true // Latch the lock permanently!
      })
      .eq("id", userId);

    if (updateError) {
      // Catching the UNIQUE constraint violation we set up in Method 1
      if (updateError.code === '23505') { // Postgres unique violation code
        return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to update referral code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Referral code locked in successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Referral Customization Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}