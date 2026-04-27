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

    const headers = {
      "x-api-key": process.env.PAYMENT_API_KEY!,
      "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      "Accept": "application/json"
    };

    // 1. Fetch live balance from Supply Smart (Absolute Truth)
    const accountsRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, { method: "GET", headers });
    const accountsData = await accountsRes.json();
    const virtualAccountsList = accountsData?.data?.result || [];
    const targetAccount = virtualAccountsList.find((acc: any) => String(acc.accountNumber) === String(accountNumber));
    const liveBalance = Number(targetAccount?.balance || 0);

    // Sync truth to Supabase wallet table
    await supabaseAdmin.from('wallets').update({ balance: liveBalance, updated_at: new Date().toISOString() }).eq('user_id', userId);

    // 2. Fetch and Sync Transaction History
    const historyRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/transaction/history`, { method: "GET", headers });
    const historyData = await historyRes.json();
    const apiTransactions = historyData?.data?.result || [];

    // Filter transactions for this user's account number
    const userTx = apiTransactions.filter((tx: any) => 
      String(tx.receiverDetails?.accountNumber).includes(accountNumber) || 
      String(tx.senderDetails?.originatingAccountNumber).includes(accountNumber) ||
      String(tx.accountNumber).includes(accountNumber) // Fallback for simple ledgers
    );

    if (userTx.length > 0) {
      const dbEntries = userTx.map((tx: any) => {
        // 🔥 MAP FIX: Based on Postman Screenshot (transactionType: "debit" or "TRANSFER")
        const typeStr = (tx.transactionType || "").toUpperCase();
        const isOutflow = typeStr === "DEBIT" || typeStr === "OUTFLOW";
        
        // 🔥 SOURCE FIX: Try reading from sender details or the nested bankResponse
        const sourceName = tx.senderDetails?.originatingAccountName 
          || tx.bankResponse?.beneficiaryAccountName 
          || "Bank Transfer";

        return {
          user_id: userId,
          amount: Number(tx.amount || tx.totalAmount || 0),
          transaction_type: isOutflow ? 'OUTFLOW' : 'INFLOW',
          status: (tx.status || tx.finalStatus || "COMPLETED").toUpperCase() === 'SUCCESSFUL' ? 'SUCCESS' : 'PENDING',
          reference: tx.transactionId || tx.paymentReference || tx._id,
          provider_tx_id: tx._id, 
          source: sourceName,
          created_at: tx.createdAt || new Date().toISOString()
        };
      });

      await supabaseAdmin.from('wallet_transactions').upsert(dbEntries, { onConflict: 'provider_tx_id' });
    }

    // 3. Return Unified History from DB (Local + Synced)
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
        success: true, 
        balance: liveBalance,
        transactions: finalHistory 
    });

  } catch (err: any) {
    console.error("🔥 History Sync Error:", err.message);
    return NextResponse.json({ success: false, error: "History sync failed" }, { status: 500 });
  }
}