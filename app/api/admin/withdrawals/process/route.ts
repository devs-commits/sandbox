import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// 🔥 FIX 1: Bulletproof check for both Plural and Singular env variables + Multiple Admins
const rawEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "admin@wdc.com, admin2@wdclabs.com"; 
const ADMIN_EMAILS = rawEmails.split(',').map(email => email.trim());

export async function POST(req: Request) {
  try {
    // ====================================================================
    // 🔒 SECURITY CHECKPOINT: VERIFY THE USER IS THE ADMIN
    // ====================================================================
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token cryptographically
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }

    // Check if the verified user is in our list of approved ADMIN_EMAILS
    if (!ADMIN_EMAILS.includes(user.email)) {
       console.warn(`🚨 SECURITY ALERT: Unauthorized user ${user.email} attempted to process a withdrawal!`);
       return NextResponse.json({ error: "Forbidden: You do not have vault privileges" }, { status: 403 });
    }
    // ====================================================================

    // Proceed with the normal logic since the user is verified
    const { transactionId, action, reason } = await req.json();

    if (!transactionId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const { data: tx, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !tx || tx.status !== 'PENDING') {
      return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 404 });
    }

    const txTotalAmount = Number(tx.total_amount || 0);
    const txAmount = Number(tx.amount || 0);
    const actionTimestamp = new Date().toISOString(); 

    // SCENARIO A: REJECT
    if (action === 'REJECT') {
      const { data: wallet } = await supabaseAdmin.from('wallets').select('balance, id').eq('user_id', tx.user_id).single();
      const currentBalance = Number(wallet?.balance || 0);
      const refundedBalance = currentBalance + txTotalAmount;

      await supabaseAdmin.from('wallets').update({ balance: refundedBalance }).eq('id', wallet?.id);

      await supabaseAdmin.from('wallet_transactions').update({ 
        status: 'FAILED', 
        // 🔥 FIX 2: This makes the user's receipt show ₦799,815 → ₦799,815 (No Money Lost!)
        balance_after: refundedBalance, 
        rejection_reason: reason || 'No reason provided', 
        admin_action_at: actionTimestamp 
      }).eq('id', tx.id);

      await supabaseAdmin.from('wallet_transactions').insert([{
        user_id: tx.user_id,
        reference: `REFUND-${tx.reference}`,
        transaction_type: 'INFLOW',
        funding_method: 'SYSTEM_REFUND', 
        amount: txTotalAmount,
        total_amount: txTotalAmount,
        balance_before: currentBalance,
        balance_after: refundedBalance,
        status: 'SUCCESS',
        source: 'Withdrawal Refund',
        receiver_info: { account_name: 'WDC Admin' } 
      }]);

      const { data: userRecord } = await supabaseAdmin.from('users').select('wallet_balance').eq('auth_id', tx.user_id).single();
      if (userRecord) {
         await supabaseAdmin.from('users').update({ 
            wallet_balance: Number(userRecord.wallet_balance || 0) + txTotalAmount 
         }).eq('auth_id', tx.user_id);
      }

      return NextResponse.json({ success: true, message: "Withdrawal rejected and funds refunded" });
    }

    // SCENARIO B: APPROVE
    if (action === 'APPROVE') {
      const { bank_code, account_number, account_name } = tx.receiver_info;

      // MOCK BYPASS FOR TESTING DUMMY ACCOUNTS
      if (process.env.NODE_ENV === "development" || account_number === "0123456789") {
          await supabaseAdmin.from('wallet_transactions').update({ 
            status: 'SUCCESS',
            provider_tx_id: `MOCK-TRF-${Date.now()}`,
            admin_action_at: actionTimestamp 
          }).eq('id', tx.id);
          return NextResponse.json({ success: true, message: "Mock Transfer Approved Successfully!" });
      }

      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "nuban", name: account_name || "WDC Student", account_number: account_number, bank_code: bank_code, currency: "NGN" }),
      });

      const recipientData = await recipientRes.json();
      if (!recipientData.status) {
        return NextResponse.json({ error: `Paystack Error: ${recipientData.message}` }, { status: 400 });
      }

      const transferRes = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(txAmount * 100), 
          recipient: recipientData.data.recipient_code,
          reference: tx.reference, 
          reason: "WDC Earnings Withdrawal",
        }),
      });

      const transferData = await transferRes.json();
      if (!transferData.status) {
        return NextResponse.json({ error: `Transfer Failed: ${transferData.message}` }, { status: 400 });
      }

      await supabaseAdmin.from('wallet_transactions').update({ 
        status: 'SUCCESS',
        provider_tx_id: transferData.data.transfer_code,
        admin_action_at: actionTimestamp 
      }).eq('id', tx.id);

      return NextResponse.json({ success: true, message: "Transfer initiated successfully!" });
    }

  } catch (error: any) {
    console.error("Admin Process Error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}