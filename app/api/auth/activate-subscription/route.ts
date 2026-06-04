import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with the SERVICE ROLE KEY to bypass RLS restrictions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { userId, plan } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const startDate = new Date();
    const expiryDate = new Date();

    // Dynamically calculate expiry based on the plan
    if (plan === "trial") {
      expiryDate.setDate(startDate.getDate() + 14); // 14 Days
    } else if (plan === "quarterly") {
      expiryDate.setMonth(startDate.getMonth() + 3); // 3 Months
    } else { 
      expiryDate.setMonth(startDate.getMonth() + 1); // 1 Month
    }

    // Force the update using the Admin client
    const { error } = await supabaseAdmin
      .from('users') 
      .update({
        subscription_status: 'active',
        plan_type: plan,
        start_date: startDate.toISOString(),
        subscription_expires_at: expiryDate.toISOString()
      })
      .eq('id', userId); 

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Subscription Activation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}