import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Admin client to bypass RLS securely on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 });
    }

    // 1. Fetch wallet details
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError || !wallet) {
       return NextResponse.json({ success: true, walletReady: false, balance: 0 });
    }

    return NextResponse.json({
      success: true,
      walletReady: true,
      walletData: wallet,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet details" },
      { status: 500 }
    );
  }
}