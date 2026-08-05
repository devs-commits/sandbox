import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: pendingTxs, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*, users(full_name, email)') // Optionally join user data if you have foreign keys set up
      .eq('status', 'PENDING')
      .eq('transaction_type', 'OUTFLOW')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: pendingTxs });
  } catch (error: any) {
    console.error("Fetch Pending Withdrawals Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}