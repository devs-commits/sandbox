import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bankCode, accountNumber, amount, accountName, nameEnquiryRef } = body;

    // 1. Validation
    if (!userId || !bankCode || !accountNumber || !amount || !accountName || !nameEnquiryRef) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // 2. Fetch User Info for the Ledger Constraints
    const { data: userData } = await supabaseAdmin!
      .from('users')
      .select('email')
      .eq('auth_id', userId)
      .single();

    const { data: wallet } = await supabaseAdmin!
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const balanceBefore = wallet?.balance || 0;
    if (balanceBefore < Number(amount)) {
        return NextResponse.json({ error: "Insufficient funds for this transfer." }, { status: 400 });
    }

    // 3. STEP ONE: Get the Encrypted Data from Supply Smart
    const rawPayload = {
      amount: String(amount),
      beneficiaryAccountName: accountName,
      beneficiaryAccountNumber: String(accountNumber),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: nameEnquiryRef
    };

    const encryptRes = await fetch(`${baseUrl}/partners/encrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "merchant-id": merchantId,
      },
      body: JSON.stringify(rawPayload)
    });

    const encryptData = await encryptRes.json();
    if (!encryptData.success || !encryptData.data) {
      return NextResponse.json({ error: "Encryption failed: " + (encryptData.message || "Unknown error") }, { status: 400 });
    }

    // 4. STEP TWO: Execute the Transfer
    const transferRes = await fetch(`${baseUrl}/partners/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "merchant-id": merchantId,
      },
      body: JSON.stringify({ data: encryptData.data }) 
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.success) {
      const balanceAfter = balanceBefore - Number(amount);
      const txId = transferResult.data?.result?.transactionId || `SS-${Date.now()}`;

      // 5. Atomic Update: Balance + Unified Ledger Entry
      await supabaseAdmin!.from('wallets').update({ balance: balanceAfter }).eq('user_id', userId);
      
      await supabaseAdmin!.from('wallet_transactions').upsert({
        user_id: userId,
        email: userData?.email || 'N/A',
        amount: Number(amount),
        transaction_type: 'OUTFLOW',
        funding_method: 'BANK_TRANSFER',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: 'SUCCESS',
        reference: txId,
        provider_tx_id: txId,
        source: 'SUPPLY_SMART',
        created_at: new Date().toISOString()
      }, { onConflict: 'provider_tx_id' });

      return NextResponse.json({ success: true, transferResult });
    } else {
      return NextResponse.json({ 
        error: transferResult.message || "Transfer declined by provider.",
        details: transferResult 
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error("🔥 Final Transfer Route Error:", err.message);
    return NextResponse.json({ error: "Internal server error during transfer processing." }, { status: 500 });
  }
}