import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import https from "https"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to mimic Postman GET with Body
const fetchHistoryFromProvider = (accountNumber: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Check for keys before even trying
    if (!process.env.PAYMENT_API_KEY || !process.env.PAYMENT_MERCHANT_ID) {
        return reject(new Error("Server Environment Variables (API Keys) are missing. Check your live host settings."));
    }

    const payload = JSON.stringify({ accountNumber });
    const options = {
      hostname: "lab-api.wdc.ng",
      path: "/api/v1/wallet-history",
      method: "GET",
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
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          console.error("Parse Error:", data);
          resolve({ data: { result: [] } }); 
        }
      });
    });

    req.on("error", (error) => { reject(new Error(`Network Request Error: ${error.message}`)); });
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

    // --- STEP 1: Sync from Provider ---
    const txData = await fetchHistoryFromProvider(accountNumber).catch(err => {
        throw new Error(`Provider Sync Failed: ${err.message}`);
    });
    
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

        return {
          user_id: userId, 
          amount: Number(tx.amount || meta.amount || 0),
          transaction_type: isOutflow ? 'OUTFLOW' : 'INFLOW',
          status: 'SUCCESS',
          reference: tx.transactionId || meta.referenceID || tx._id, 
          provider_tx_id: tx._id, 
          source: sourceName,
          created_at: tx.createdAt || meta.transactionDate || new Date().toISOString()
        };
      });

      // --- STEP 2: Database Upsert ---
      const { error: upsertError } = await supabaseAdmin
        .from('wallet_transactions')
        .upsert(dbEntries, { onConflict: 'provider_tx_id' });
      
      if (upsertError) throw new Error(`Database Upsert Failed: ${upsertError.message}`);
      
    } else {
      // Fallback balance check
      const walletRes = await fetch(`https://lab-api.wdc.ng/api/v1/get-all-virtual-wallet?limit=1000`, { 
        method: "GET", 
        headers: { "x-api-key": process.env.PAYMENT_API_KEY!, "merchant-id": process.env.PAYMENT_MERCHANT_ID! }
      });
      const walletData = await walletRes.json().catch(() => ({}));
      const allWallets = Array.isArray(walletData?.data) ? walletData.data : [];
      const targetAccount = allWallets.find((w: any) => String(w.accountNumber) === String(accountNumber));
      finalBalance = Number(targetAccount?.balance || 0);
    }

    // --- STEP 3: Update Local Wallet Table ---
    const { error: walletError } = await supabaseAdmin
        .from('wallets')
        .update({ balance: finalBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    
    if (walletError) throw new Error(`Wallet Update Failed: ${walletError.message}`);

    // --- STEP 4: Final Fetch ---
    const { data: finalHistory, error: fetchError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) throw new Error(`Final History Fetch Failed: ${fetchError.message}`);

    return NextResponse.json({ 
        success: true, 
        balance: finalBalance,
        transactions: finalHistory || [] 
    });

  } catch (err: any) {
    // 🔥 This will now show the SPECIFIC failure in your Network tab
    console.error("🔥 Detailed Crash:", err.message);
    return NextResponse.json({ 
        success: false, 
        error: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}