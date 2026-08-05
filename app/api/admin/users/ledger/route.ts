import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔥 Supports comma-separated emails and converts everything to lowercase
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "admin@wdc.com,admin2@wdc.com")
  .split(',')
  .map(e => e.trim().toLowerCase());

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // 🔒 Security Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    const userEmail = user?.email?.toLowerCase() || '';

    if (authError || !user || !ADMIN_EMAILS.includes(userEmail)) {
      // 🔥 This log will tell you exactly why it's failing in the terminal!
      console.error(`🚨 [LEDGER API] 403 Forbidden - User email: "${userEmail}". Allowed admins:`, ADMIN_EMAILS);
      return NextResponse.json({ error: "Forbidden: You do not have vault privileges" }, { status: 403 });
    }

    // Fetch last 10 transactions to spot fraud
    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Ledger Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}