import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Admin to bypass RLS so we can search all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 });
    }

    // 🔥 IMPORTANT: Make sure 'referral_code' matches your actual Supabase column name!
    const { data: user, error } = await supabaseAdmin
      .from("users") 
      .select("full_name")
      .eq("referral_code", code.trim()) // Checking if the code matches
      .single();

    if (error || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid referral code. Please check and try again." 
      });
    }

    return NextResponse.json({ 
      success: true, 
      inviterName: user.full_name 
    });

  } catch (error: any) {
    console.error("Referral Verification Error:", error);
    return NextResponse.json({ success: false, error: "Server error verifying code" }, { status: 500 });
  }
}