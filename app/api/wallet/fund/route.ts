import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  console.log("Fund Wallet API called");
  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { reference, amount, email } = body;

    // 1. Verify the user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || '',
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.log("User authenticated:", user.id);

    if (!supabaseAdmin) {
      console.error("Supabase Admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Check for existing transaction (Idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from('recruiter_transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTx) {
      console.log("Transaction already processed:", reference);
      return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 409 });
    }

    let verifiedAmount = 0;

    // 2. Verify transaction with Paystack (Server-side)
    if (process.env.PAYSTACK_SECRET_KEY) {
      console.log("Verifying with Paystack...");
      try {
        const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });
        
        if (!paystackResponse.ok) {
           const errorText = await paystackResponse.text();
           console.error("Paystack verification failed:", errorText);
           throw new Error("Paystack verification failed: " + errorText);
        }

        const paystackData = await paystackResponse.json();
        console.log("Paystack verification success:", paystackData.data.status);
        
        if (!paystackData.status || paystackData.data.status !== 'success') {
          throw new Error("Invalid transaction status: " + paystackData.data.status);
        }
        
        // Use the amount from Paystack (in kobo) converted to Naira
        verifiedAmount = paystackData.data.amount / 100;

      } catch (err) {
        console.error("Paystack verification error:", err);
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
      }
    } else {
      console.warn("PAYSTACK_SECRET_KEY not found. Skipping server-side verification. (DEV ONLY)");
      // Fallback to body amount if no secret key (ONLY FOR DEV)
      verifiedAmount = Number(amount);
    }

    // 3. Get Recruiter Profile
    console.log("Fetching recruiter profile for auth_id:", user.id);
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('recruiters')
      .select('id, wallet_balance')
      .eq('auth_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      console.error("Recruiter profile not found or error:", recruiterError);
      return NextResponse.json({ success: false, error: "Recruiter profile not found" }, { status: 404 });
    }
    console.log("Recruiter found:", recruiter);

    // 4. Update Wallet Balance
    const newBalance = (recruiter.wallet_balance || 0) + verifiedAmount;
    console.log("Updating balance. Old:", recruiter.wallet_balance, "New:", newBalance);

    const { error: updateError } = await supabaseAdmin
      .from('recruiters')
      .update({ wallet_balance: newBalance })
      .eq('id', recruiter.id);

    if (updateError) {
      console.error("Error updating wallet balance:", updateError);
      throw updateError;
    }

    // 5. Log Transaction
    console.log("Logging transaction...");
    const { error: transactionError } = await supabaseAdmin
      .from('recruiter_transactions')
      .insert({
        recruiter_id: recruiter.id,
        amount: verifiedAmount,
        type: 'credit',
        description: 'Wallet Funding (Paystack)',
        reference: reference,
      });

    if (transactionError) {
      console.error("Error logging transaction:", transactionError);
      // We don't fail the request if logging fails, but we should alert admin
    } else {
      console.log("Transaction logged successfully");
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (error: any) {
    console.error("Funding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
