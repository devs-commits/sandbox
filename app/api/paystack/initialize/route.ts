import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, amount, callback_url, userId, fullName, track, role } = await req.json();

    // 🔥 THE FIX: Abandoned Cart Recovery - Lookup user if frontend sends null
    let dbUserId = userId; 
    if (!dbUserId && email) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('auth_id')
        .eq('email', email)
        .single();
      
      dbUserId = existingUser?.auth_id || null;
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack requires amount in kobo
        callback_url,
      }),
    });

    const data = await res.json();

    if (data.status) {
      // 🔥 Log the entry in your payments table immediately with the correctly fetched ID
      await supabaseAdmin.from('payments').insert({
        email: email,
        full_name: fullName,
        track: track,
        role: role,
        amount: amount,
        payment_method: 'paystack',
        payment_status: 'pending', // Matches your existing convention
        reference: data.data.reference, // Paystack's unique ref
        user_id: dbUserId // 🔥 Updated here
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Initialization failed" }, { status: 500 });
  }
}