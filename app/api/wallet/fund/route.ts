import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail } from "@/lib/zeptomail"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { reference, amount } = await req.json();

    // 1. Authenticate the user making the request
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Prevent Double-Crediting (Crucial FinTech Security)
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('provider_tx_id', `PAYSTACK-${reference}`)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 409 });
    }

    // 3. Verify the transaction directly with Paystack's servers
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    // Paystack returns kobo, convert to Naira
    const verifiedAmount = Number(paystackData.data.amount) / 100;
    const customerEmail = paystackData.data.customer.email;

    // 4. Pull the user's real profile and current wallet balance
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', user.id)
      .single();

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    const balanceBefore = Number(wallet?.balance || 0);
    const balanceAfter = balanceBefore + verifiedAmount;

    // 5. Update (or create) the global wallet balance
    await supabaseAdmin
      .from('wallets')
      .upsert({ 
        user_id: user.id, 
        balance: balanceAfter, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    // 6. Log the official transaction to the Master Ledger
    await supabaseAdmin.from('wallet_transactions').insert({
      user_id: user.id,
      email: customerEmail,
      amount: verifiedAmount,
      transaction_type: 'INFLOW',
      funding_method: 'PAYSTACK_CARD',
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'SUCCESS',
      reference: reference,
      provider_tx_id: `PAYSTACK-${reference}`,
      source: 'PAYSTACK', // The history route will rename this to "Paystack Card Top-up" for the UI
      created_at: paystackData.data.paid_at || new Date().toISOString()
    });

    // 7. Send the Receipt Email
    const targetEmail = userProfile?.email || customerEmail;
    const firstName = userProfile?.full_name?.split(' ')[0] || "Intern";
    
    // Non-blocking email send
    sendDepositEmail(targetEmail, firstName, verifiedAmount, balanceAfter, reference).catch(e => console.error("Email error:", e));

    return NextResponse.json({ success: true, newBalance: balanceAfter });

  } catch (error: any) {
    console.error("🔥 Funding API Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}