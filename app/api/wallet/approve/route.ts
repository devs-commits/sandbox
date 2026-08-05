import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, adminId } = body;

    if (!transactionId || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. FETCH THE PENDING REQUEST
    const { data: tx, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('status', 'PENDING_APPROVAL')
      .single();

    if (txError || !tx) {
      return NextResponse.json({ error: "Valid pending transaction not found" }, { status: 404 });
    }

    // ====================================================================
    // 2. PAYSTACK STEP 1: CREATE TRANSFER RECIPIENT
    // ====================================================================
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: tx.receiver_info.account_name,
        account_number: tx.receiver_info.account_number,
        bank_code: tx.receiver_info.bank_code,
        currency: "NGN",
      }),
    });

    const recipientData = await recipientRes.json();
    
    if (!recipientRes.ok || !recipientData.status) {
      throw new Error(recipientData.message || "Failed to validate destination bank account with Paystack");
    }

    const recipientCode = recipientData.data.recipient_code;
    const transferReference = `WDC-PAY-${crypto.randomBytes(8).toString('hex')}`;

    // ====================================================================
    // 3. PAYSTACK STEP 2: INITIATE THE TRANSFER
    // ====================================================================
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance", 
        amount: tx.amount * 100, // Send exactly what the user requested (Kobo)
        reference: transferReference,
        recipient: recipientCode,
        reason: "WDC Labs Approved Payout",
      }),
    });

    const transferData = await transferRes.json();

    if (!transferRes.ok || !transferData.status) {
      throw new Error(transferData.message || "Failed to initiate transfer with Paystack");
    }

    // ====================================================================
    // 4. UPDATE DATABASE TO REFLECT PROCESSING STATE
    // ====================================================================
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ 
        status: 'PENDING', // Changes from PENDING_APPROVAL to standard PENDING while Paystack processes it
        provider_tx_id: `PAYSTACK-${transferData.data.transfer_code}`,
        admin_approved_by: adminId, // Audit trail
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    // (Paystack's Master Webhook will automatically mark this as 'SUCCESS' once the bank clears it)

    return NextResponse.json({
      success: true,
      message: "Payout approved and sent to Paystack successfully",
    });

  } catch (error: any) {
    console.error("Admin Approval Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}