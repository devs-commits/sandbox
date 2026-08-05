import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch OUTFLOW transactions that are either SUCCESS or FAILED
    const { data: historyTxs, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*, users(full_name, email)')
      .in('status', ['SUCCESS', 'FAILED'])
      .eq('transaction_type', 'OUTFLOW')
      .order('admin_action_at', { ascending: false, nullsFirst: false })
      .limit(50); // Limit to last 50 for performance

    if (error) throw error;
    return NextResponse.json({ success: true, data: historyTxs });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}