import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize the Admin Client to bypass RLS for database updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, transactionId } = body;

    if (!userId || !transactionId) {
      return NextResponse.json({ error: "Missing userId or transactionId" }, { status: 400 });
    }

    // 1. Link the pending payment to the newly created user and mark it paid
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({
         user_id: userId,
         payment_status: "paid"
      })
      .eq("id", transactionId);

    if (paymentError) {
      console.error("Database Error (Payments):", paymentError.message);
      return NextResponse.json({ error: "Failed to link payment to account" }, { status: 500 });
    }

    // 2. Activate the user's subscription status
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ 
        subscription_status: "active" 
      })
      .eq("auth_id", userId);

    if (userError) {
      console.error("Database Error (Users):", userError.message);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("FINALIZE ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}