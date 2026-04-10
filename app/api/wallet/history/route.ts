import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber } = await req.json();

    if (!userId || !accountNumber || accountNumber === "****") {
      return NextResponse.json({ success: false, error: "Missing account credentials" }, { status: 400 });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('auth_id', userId)
      .maybeSingle();

    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('bank_name, account_number')
      .eq('user_id', userId)
      .maybeSingle();

    // ==========================================
    // 1. FETCH EXACT BALANCE (Absolute Truth)
    // ==========================================
    const accountsRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
        "Accept": "application/json"
      }
    });
    
    const accountsData = await accountsRes.json();
    const virtualAccountsList = accountsData?.data?.result || [];
    const targetAccount = virtualAccountsList.find((acc: any) => String(acc.accountNumber) === String(accountNumber));
    
    const liveSSBalance = Number(targetAccount?.balance || 0);

    // Sync truth to Supabase wallet table
    await supabaseAdmin
      .from('wallets')
      .update({ balance: liveSSBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // ==========================================
    // 2. JIT SYNC: FETCH DEPOSITS FROM SS
    // ==========================================
    const historyRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/transaction/history`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
        "Accept": "application/json"
      }
    });

    const historyData = await historyRes.json();
    const apiTransactions = historyData?.data?.result || [];

    const targetAccStr = String(accountNumber).padStart(10, '0');
    const userTx = apiTransactions.filter((tx: any) => {
        const receiverStr = String(tx.receiverDetails?.accountNumber || "").padStart(10, '0');
        const senderStr = String(tx.senderDetails?.originatingAccountNumber || "").padStart(10, '0');
        return receiverStr === targetAccStr || senderStr === targetAccStr;
    });

    // ==========================================
    // 3. UPSERT DEPOSITS TO SUPABASE
    // ==========================================
    if (userTx.length > 0) {
      const dbEntries = userTx.map((tx: any) => {
        const isInflow = tx.transactionType === "PARTNER_INFLOW" || String(tx.receiverDetails?.accountNumber).includes(targetAccStr);
        let sourceName = isInflow ? 'Bank Transfer Funding' : 'Wallet Withdrawal';
        if (isInflow && tx.senderDetails?.originatingAccountName) {
             sourceName = `Deposit from ${tx.senderDetails.originatingAccountName}`;
        }

        return {
            user_id: userId,
            email: userData?.email || 'N/A',
            amount: Number(tx.amount || 0),
            transaction_type: isInflow ? 'INFLOW' : 'OUTFLOW',
            funding_method: 'BANK_TRANSFER', 
            status: tx.status === 'SUCCESSFUL' ? 'SUCCESS' : 'PENDING',
            reference: tx.transactionReference || tx.providerReference || tx._id,
            provider_tx_id: tx._id, 
            source: sourceName, 
            created_at: tx.createdAt || new Date().toISOString()
        };
      });

      // Safely ignore duplicates. Only adds NEW deposits.
      await supabaseAdmin.from('wallet_transactions').upsert(dbEntries, { onConflict: 'provider_tx_id' });
    }

    // ==========================================
    // 4. FETCH UNIFIED HISTORY FROM SUPABASE
    // ==========================================
    // This grabs the deposits we just synced + your local WITHDRAWALS!
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const formattedTransactions = (finalHistory || []).map((tx) => ({
        id: tx.provider_tx_id || tx.id,
        amount: Number(tx.amount),
        type: tx.transaction_type,
        status: tx.status,
        reference: tx.reference,
        source: tx.source,
        date: tx.created_at
    }));

    // ==========================================
    // 5. RETURN PERFECTION TO UI
    // ==========================================
    return NextResponse.json({ 
        success: true, 
        balance: liveSSBalance, // Direct from Supply Smart (Truth)
        accountNumber: walletData?.account_number || accountNumber,
        bankName: walletData?.bank_name || 'Parallex Bank',
        transactions: formattedTransactions // Unified List (SS Deposits + Local Withdrawals)
    });

  } catch (err: any) {
    console.error("🔥 API CRASH:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}