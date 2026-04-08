import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("payments")
      .select("payment_status")
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false });
    }

    // 🔥 THE FIX: Marrying 'confirmed' (Transfer) and 'successful' (Paystack)
    const status = data.payment_status?.toLowerCase() || "";
    const isConfirmed = ["confirmed", "successful", "success"].includes(status);

    return NextResponse.json({ success: isConfirmed });
    
  } catch (err: any) {
    console.error("Verification Error:", err.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}