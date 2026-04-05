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

    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('provider_tx_id', `PAYSTACK-${reference}`)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 409 });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    const verifiedAmount = paystackData.data.amount / 100;
    const customerEmail = paystackData.data.customer.email;

    // 🔥 Pulling the user's real email from Supabase
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', user.id)
      .single();

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const balanceBefore = Number(wallet?.balance || 0);
    const balanceAfter = balanceBefore + verifiedAmount;

    await supabaseAdmin
      .from('wallets')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    await supabaseAdmin.from('wallet_transactions').upsert({
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
      source: 'PAYSTACK',
      created_at: paystackData.data.paid_at || new Date().toISOString()
    }, { onConflict: 'provider_tx_id' });

    // 🔥 Using the target email (Supabase over Paystack dummy email)
    const targetEmail = userProfile?.email || customerEmail;
    const firstName = userProfile?.full_name?.split(' ')[0] || "Intern";
    
    await sendDepositEmail(targetEmail, firstName, verifiedAmount, balanceAfter, reference);

    return NextResponse.json({ success: true, newBalance: balanceAfter });

  } catch (error: any) {
    console.error("🔥 Funding API Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}