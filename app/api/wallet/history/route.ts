import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import https from "https"; // Native Node module to bypass fetch limitations

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to force a GET request with a JSON body (mimicking Postman exactly)
const fetchHistoryFromProvider = (accountNumber: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ accountNumber });
    const options = {
      hostname: "lab-api.wdc.ng",
      path: "/api/v1/wallet-history",
      method: "GET", // Forcing GET exactly like Postman
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error("Failed to parse Supply Smart response:", data);
          resolve({ data: { result: [] } }); // Safe fallback
        }
      });
    });

    req.on("error", (error) => { reject(error); });
    req.write(payload);
    req.end();
  });
};

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber } = await req.json();

    if (!userId || !accountNumber || accountNumber === "****") {
      return NextResponse.json({ success: false, error: "Missing account credentials" }, { status: 400 });
    }

    let finalBalance = 0;

    // ==========================================
    // 1. FETCH TRANSACTIONS (Using our custom Postman mimic)
    // ==========================================
    const txData = await fetchHistoryFromProvider(accountNumber);
    
    // 🔥 DEBUG: Watch your VS Code terminal to see exactly what Supply Smart returns!
    console.log("SUPPLY SMART API RESPONSE:", JSON.stringify(txData, null, 2));

    const apiTransactions = Array.isArray(txData?.data?.result) ? txData.data.result : [];

    if (apiTransactions.length > 0) {
      finalBalance = Number(apiTransactions[0].balanceAfter || 0);

      const dbEntries = apiTransactions.map((tx: any) => {
        const typeStr = String(tx.transactionType || "").toUpperCase();
        const isOutflow = typeStr === "OUTFLOW" || typeStr === "DEBIT";
        const meta = tx.metadata || {};
        
        const sourceName = isOutflow 
            ? (meta.beneficiaryAccountName || tx.publishers || "Bank Transfer")
            : (meta.originatingAccountName || meta.originatingBankName || "Bank Deposit");

        const rawStatus = String(tx.finalStatus || tx.status || "SUCCESS").toUpperCase();

        return {
          user_id: userId,
          amount: Number(tx.amount || meta.amount || 0),
          transaction_type: isOutflow ? 'OUTFLOW' : 'INFLOW',
          status: rawStatus === "COMPLETED" ? "SUCCESS" : rawStatus,
          reference: tx.transactionId || meta.referenceID || tx._id, 
          provider_tx_id: tx._id, 
          source: sourceName,
          created_at: tx.createdAt || meta.transactionDate || new Date().toISOString()
        };
      });

      const { error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .upsert(dbEntries, { onConflict: 'provider_tx_id' });
        
      if (txError) console.error("Transaction upsert error:", txError.message);
      
    } else {
      // Fallback if History array is empty
      console.log("No transactions found, fetching standard wallet balance...");
      const walletRes = await fetch(`https://lab-api.wdc.ng/api/v1/get-all-virtual-wallet?limit=1000`, { 
        method: "GET", 
        headers: { "x-api-key": process.env.PAYMENT_API_KEY!, "merchant-id": process.env.PAYMENT_MERCHANT_ID! }
      });
      const walletData = await walletRes.json().catch(() => ({}));
      const allWallets = Array.isArray(walletData?.data) ? walletData.data : [];
      const targetAccount = allWallets.find((w: any) => String(w.accountNumber) === String(accountNumber));
      finalBalance = Number(targetAccount?.balance || 0);
    }

    // ==========================================
    // 2. UPDATE LIVE BALANCE IN DB
    // ==========================================
    await supabaseAdmin
        .from('wallets')
        .update({ balance: finalBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    // ==========================================
    // 3. RETURN UNIFIED HISTORY TO FRONTEND
    // ==========================================
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
        success: true, 
        balance: finalBalance,
        transactions: finalHistory 
    });

  } catch (err: any) {
    console.error("🔥 History Sync Error:", err.message);
    return NextResponse.json({ success: false, error: "History sync failed" }, { status: 500 });
  }
}