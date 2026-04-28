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
      "Content-Type": "application/json",
      "x-api-key": process.env.PAYMENT_API_KEY!,
      "merchant-id": process.env.PAYMENT_MERCHANT_ID!
    };

    const wdcBase = "https://lab-api.wdc.ng/api/v1";

    // --- 1. FETCH LIVE BALANCE ---
    const walletRes = await fetch(`${wdcBase}/get-all-virtual-wallet?limit=1000`, { method: "GET", headers });
    const walletData = await walletRes.json().catch(() => ({}));
    const allWallets = Array.isArray(walletData?.data) ? walletData.data : [];
    const targetAccount = allWallets.find((w: any) => String(w.accountNumber) === String(accountNumber));
    const liveBalance = Number(targetAccount?.balance || 0);

    // Sync truth to Supabase wallet table
    await supabaseAdmin.from('wallets').update({ balance: liveBalance, updated_at: new Date().toISOString() }).eq('user_id', userId);

    // --- 2. FETCH AND SYNC TRANSACTIONS ---
    // Using your exact WDC API endpoint that requires accountNumber in the body
    const txRes = await fetch(`${wdcBase}/transactions`, {
      method: "POST", // Adjust to GET if your API strictly requires it, but fetch bodies usually require POST
      headers,
      body: JSON.stringify({ accountNumber })
    });
    
    const txData = await txRes.json().catch(() => ({}));
    const apiTransactions = Array.isArray(txData?.data?.result) ? txData.data.result : [];

    if (apiTransactions.length > 0) {
      const dbEntries = apiTransactions.map((tx: any) => {
        // Map "debit" to OUTFLOW, "credit" to INFLOW
        const typeStr = String(tx.transactionType || "").toLowerCase();
        const isOutflow = typeStr === "debit";
        
        // Grab the name from bankResponse if it exists
        const sourceName = tx.bankResponse?.beneficiaryAccountName || "Wallet Transaction";

        // Map Status correctly
        const rawStatus = String(tx.status || "completed").toLowerCase();
        let finalStatus = "PENDING";
        if (rawStatus === "completed" || rawStatus === "successful") finalStatus = "SUCCESS";
        if (rawStatus === "failed") finalStatus = "FAILED";

        return {
          user_id: userId,
          amount: Number(tx.amount || 0),
          transaction_type: isOutflow ? 'OUTFLOW' : 'INFLOW',
          status: finalStatus,
          // CRITICAL FIX: Use tx._id because failed transactions return "N/A" for transactionId
          reference: tx._id, 
          provider_tx_id: tx._id, 
          source: sourceName,
          created_at: tx.createdAt || new Date().toISOString()
        };
      });

      // Upsert into Supabase using provider_tx_id to prevent duplicates
      const { error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .upsert(dbEntries, { onConflict: 'provider_tx_id' });
        
      if (txError) console.error("Transaction upsert error:", txError.message);
    }

    // --- 3. RETURN UNIFIED HISTORY ---
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
        success: true, 
        balance: liveBalance,
        bankName: targetAccount?.bankName || "Parallex Bank",
        transactions: finalHistory 
    });

  } catch (err: any) {
    console.error("🔥 History Sync Error:", err.message);
    return NextResponse.json({ success: false, error: "History sync failed" }, { status: 500 });
  }
}