import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();

    const { data, error } = await supabase
      .from("payments")
      .select("payment_status")
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ success: false });

    const isConfirmed = ["confirmed", "success"].includes(data.payment_status);

    return NextResponse.json({ success: isConfirmed });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}