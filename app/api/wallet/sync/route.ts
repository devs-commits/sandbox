import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', userId)
      .single();

    if (!userProfile) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    // 1. Get Global Balance AND Both Snapshots
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, last_ss_balance, last_paystack_balance')
      .eq('user_id', userId)
      .single();

    let currentGlobalBalance = Number(wallet?.balance || 0);
    const lastKnownSSBalance = Number(wallet?.last_ss_balance || 0);
    const lastKnownPaystackBalance = Number(wallet?.last_paystack_balance || 0);

    // ==========================================
    // 🔍 FETCH 1: SUPPLY SMART
    // ==========================================
    const ssRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
      method: "GET",
      headers: { "x-api-key": process.env.PAYMENT_API_KEY!, "merchant-id": process.env.PAYMENT_MERCHANT_ID! }
    });
    const ssData = await ssRes.json();
    const walletsList = ssData?.data?.result || [];
    const providerWallet = walletsList.find((w: any) => 
      w.accountName.toUpperCase().includes(userProfile.full_name.toUpperCase())
    );

    const liveSSBalance = Number(providerWallet?.balance || 0);
    const liveAccountNumber = providerWallet?.accountNumber || null;
    const liveBankName = providerWallet?.bankName || null;

    // ==========================================
    // 🔍 FETCH 2: PAYSTACK
    // ==========================================
    const paystackRes = await fetch(`https://api.paystack.co/transaction?email=${userProfile.email}&status=success`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();
    
    // Sum up all successful Paystack transactions (convert kobo to naira)
    let livePaystackTotal = 0;
    if (paystackData.status && paystackData.data) {
      livePaystackTotal = paystackData.data.reduce((sum: number, tx: any) => sum + (tx.amount / 100), 0);
    }

    // ==========================================
    // 🧮 RECONCILIATION MATH
    // ==========================================
    const newSSDeposit = liveSSBalance - lastKnownSSBalance;
    const newPaystackDeposit = livePaystackTotal - lastKnownPaystackBalance;

    const updates: any = { updated_at: new Date().toISOString() };
    if (liveAccountNumber && liveBankName) {
        updates.account_number = liveAccountNumber;
        updates.bank_name = liveBankName;
    }

    let fundsAdded = false;

    // --- Process Missing Supply Smart Funds ---
    if (newSSDeposit > 0) {
      currentGlobalBalance += newSSDeposit;
      updates.balance = currentGlobalBalance;
      updates.last_ss_balance = liveSSBalance;
      
      const txRef = `SS-VIRT-${Date.now()}`;
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId, email: userProfile.email || 'N/A', amount: newSSDeposit,
        transaction_type: 'INFLOW', funding_method: 'BANK_TRANSFER',
        balance_before: currentGlobalBalance - newSSDeposit, balance_after: currentGlobalBalance,
        status: 'SUCCESS', reference: txRef, provider_tx_id: txRef, source: 'SUPPLY_SMART', created_at: new Date().toISOString()
      });

      if (userProfile.email) {
        await sendDepositEmail(userProfile.email, userProfile.full_name.split(' ')[0] || "Intern", newSSDeposit, currentGlobalBalance, txRef);
      }
      fundsAdded = true;
    }

    // --- Process Missing Paystack Funds ---
    if (newPaystackDeposit > 0) {
      currentGlobalBalance += newPaystackDeposit;
      updates.balance = currentGlobalBalance;
      updates.last_paystack_balance = livePaystackTotal;

      const txRef = `PS-RECOV-${Date.now()}`;
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId, email: userProfile.email || 'N/A', amount: newPaystackDeposit,
        transaction_type: 'INFLOW', funding_method: 'PAYSTACK_CARD',
        balance_before: currentGlobalBalance - newPaystackDeposit, balance_after: currentGlobalBalance,
        status: 'SUCCESS', reference: txRef, provider_tx_id: txRef, source: 'PAYSTACK', created_at: new Date().toISOString()
      });

      if (userProfile.email) {
        await sendDepositEmail(userProfile.email, userProfile.full_name.split(' ')[0] || "Intern", newPaystackDeposit, currentGlobalBalance, txRef);
      }
      fundsAdded = true;
    }

    // ==========================================
    // 💾 SAVE TO DATABASE
    // ==========================================
    await supabaseAdmin.from('wallets').update(updates).eq('user_id', userId);

    if (fundsAdded) {
      console.log(`💰 Dual Sync: Recovered SS: ₦${newSSDeposit > 0 ? newSSDeposit : 0} | Recovered PS: ₦${newPaystackDeposit > 0 ? newPaystackDeposit : 0}. New Global: ₦${currentGlobalBalance}`);
    } else {
      console.log(`✅ Dual Sync: Ledgers are perfectly balanced. No missing funds.`);
    }

    return NextResponse.json({ 
      success: true, 
      balance: currentGlobalBalance,
      accountNumber: liveAccountNumber,
      bankName: liveBankName
    });

  } catch (err: any) {
    console.error("🔥 Sync Failure:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}