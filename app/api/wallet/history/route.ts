import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber } = await req.json();
    console.log("🔍 Checking history for account:", accountNumber);

    // 1. Get User Data (Need the email for the DB constraint)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('auth_id', userId)
      .single();

    // 2. Fetch from Supply Smart
    const res = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/transaction/history`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      }
    });

    const responseData = await res.json();
    const apiTransactions = responseData?.data?.result || [];

    // 3. Filter with padding safety (The fix for "userTx is not defined")
    const target = String(accountNumber).padStart(10, '0');
    
    const userTx = apiTransactions.filter((tx: any) => {
        const receiver = String(tx.receiverDetails?.accountNumber || "").padStart(10, '0');
        const sender = String(tx.senderDetails?.originatingAccountNumber || "").padStart(10, '0');
        return receiver === target || sender === target;
    });

    console.log(`✅ Found ${userTx.length} matching transactions.`);

    // 4. If we have matches, sync them to the DB
    if (userTx.length > 0) {
      const dbEntries = userTx.map((tx: any) => {
        const receiverAcc = String(tx.receiverDetails?.accountNumber || "").padStart(10, '0');
        const isInflow = receiverAcc === target;
        
        return {
            user_id: userId,
            email: userData?.email || 'N/A',
            amount: Number(tx.amount),
            transaction_type: isInflow ? 'INFLOW' : 'OUTFLOW',
            funding_method: 'BANK_TRANSFER', // 🔥 Matches the new SQL constraint exactly
            balance_before: 0,
            balance_after: 0,
            status: 'SUCCESS',
            reference: tx.paymentReference || tx.sessionID || tx._id, // 🔥 Satisfies NOT NULL
            provider_tx_id: tx._id, 
            source: 'SUPPLY_SMART',
            sender_info: tx.senderDetails || {},
            receiver_info: tx.receiverDetails || {},
            created_at: tx.createdAt || new Date().toISOString()
        };

        
      });

      const { error: upsertError } = await supabaseAdmin
        .from('wallet_transactions')
        .upsert(dbEntries, { onConflict: 'provider_tx_id' });

      if (upsertError) console.error("❌ DB UPSERT ERROR:", upsertError.message);
    }

    // 5. Always return the full history from the DB (The Marriage)
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, transactions: finalHistory || [] });

  } catch (err: any) {
    console.error("🔥 API CRASH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}