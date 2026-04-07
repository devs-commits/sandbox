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

    // 1. Get User Data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('auth_id', userId)
      .maybeSingle();

    // 2. Fetch from Supply Smart
    const res = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/transaction/history`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
        "Accept": "application/json"
      }
    });

    const responseData = await res.json();
    const apiTransactions = responseData?.data?.result || [];

    // 3. Filter for THIS specific student's account
    const targetAccStr = String(accountNumber).padStart(10, '0');
    
    const userTx = apiTransactions.filter((tx: any) => {
        const receiverStr = String(tx.receiverDetails?.accountNumber || "").padStart(10, '0');
        const senderStr = String(tx.senderDetails?.originatingAccountNumber || "").padStart(10, '0');
        return receiverStr === targetAccStr || senderStr === targetAccStr;
    });

    // 4. Map the exact JSON schema to your database
    if (userTx.length > 0) {
      const dbEntries = userTx.map((tx: any) => {
        // Check if it's an inflow based on the exact JSON you provided
        const isInflow = tx.transactionType === "PARTNER_INFLOW" || String(tx.receiverDetails?.accountNumber).includes(String(accountNumber));
        
        // Extract real names instead of generic terms!
        let sourceName = 'Supply Smart Transfer';
        if (isInflow && tx.senderDetails?.originatingAccountName) {
             sourceName = tx.senderDetails.originatingAccountName; // e.g. "ADEMOLA JOHN ALABI"
        } else if (!isInflow && tx.receiverDetails?.bankName) {
             sourceName = `Transfer to ${tx.receiverDetails.bankName}`; // e.g. "Transfer to Opay"
        }

        return {
            user_id: userId,
            email: userData?.email || 'N/A',
            amount: Number(tx.amount || 0), // Pulls the exact "500" from the JSON
            transaction_type: isInflow ? 'INFLOW' : 'OUTFLOW',
            funding_method: 'BANK_TRANSFER', 
            balance_before: 0,
            balance_after: 0,
            status: tx.status === 'SUCCESSFUL' ? 'SUCCESS' : 'PENDING',
            reference: tx.transactionReference || tx.providerReference || tx._id, // Captures TRN-...
            provider_tx_id: tx._id, 
            source: sourceName, // 🔥 This passes the real name to the DB!
            sender_info: tx.senderDetails || {},
            receiver_info: tx.receiverDetails || {},
            created_at: tx.createdAt || new Date().toISOString()
        };
      });

      // Upsert into DB
      await supabaseAdmin
        .from('wallet_transactions')
        .upsert(dbEntries, { onConflict: 'provider_tx_id' });
    }

    // 5. Return the full history
    const { data: finalHistory } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, transactions: finalHistory || [] });

  } catch (err: any) {
    console.error("🔥 API CRASH:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}