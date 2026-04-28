import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalEmail } from "@/lib/zeptomail"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bankCode, bankName, accountNumber, amount, accountName, nameEnquiryRef, pin } = body;

    if (!userId || !pin || !amount || !accountNumber || !bankCode || !nameEnquiryRef) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    // ==========================================
    // 1. SECURITY CHECK: PIN & BALANCE
    // ==========================================
    // 🔥 FIX: Added account_number to payload and used transaction_pin
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, transaction_pin, account_number')
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    }

    if (wallet.transaction_pin !== pin) {
      return NextResponse.json({ error: "Incorrect Security PIN." }, { status: 403 });
    }

    const withdrawAmount = Number(amount);
    const balanceBefore = Number(wallet.balance || 0);
    
    if (balanceBefore < withdrawAmount) {
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const wdcBase = "https://lab-api.wdc.ng/api/v1";

    // ==========================================
    // 2. ENCRYPT PAYLOAD
    // ==========================================
    // 🔥 FIX: Strict matching to Postman to prevent hash mismatch
    const rawPayload = {
      amount: String(withdrawAmount),
      beneficiaryAccountNumber: String(accountNumber),
      beneficiaryAccountName: String(accountName),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: String(nameEnquiryRef)
    };

    // 🔥 FIX: Correct URL path based on your Postman screenshot
    const encryptRes = await fetch(`${wdcBase}/transfer/partners/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify(rawPayload)
    });

    const encryptData = await encryptRes.json();
    
    if (!encryptRes.ok || !encryptData.success || !encryptData.data?.result) {
      console.error("Encryption Failed:", encryptData);
      return NextResponse.json({ error: "Failed to secure transaction data" }, { status: 500 });
    }

    // ==========================================
    // 3. EXECUTE ENCRYPTED TRANSFER
    // ==========================================
    // 🔥 FIX: Included originatorAccountNumber
    const transferRes = await fetch(`${wdcBase}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify({ 
        originatorAccountNumber: wallet.account_number,
        data: encryptData.data.result 
      }) 
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.success) {
      const balanceAfter = balanceBefore - withdrawAmount;
      const txDetails = transferResult.data?.walletTransaction || transferResult.data || {};
      const txId = txDetails.transactionId || txDetails._id || `WTH-${Date.now()}`;

      // ==========================================
      // 4. UPDATE LEDGER & BALANCE
      // ==========================================
      await supabaseAdmin
        .from('wallets')
        .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
        
      await supabaseAdmin.from('wallet_transactions').upsert({
        user_id: userId,
        amount: withdrawAmount,
        transaction_type: 'OUTFLOW',
        status: 'SUCCESS', 
        reference: txId,
        provider_tx_id: txDetails._id || txId,
        source: `Withdrawal to ${bankName}`,
        created_at: new Date().toISOString()
      }, { onConflict: 'provider_tx_id' });

      // ==========================================
      // 5. NOTIFY USER (Zeptomail)
      // ==========================================
      const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('auth_id', userId).single();
      if (user?.email) {
        await sendWithdrawalEmail(
            user.email, 
            user.full_name.split(' ')[0], 
            withdrawAmount, 
            balanceAfter, 
            bankName, 
            accountName, 
            accountNumber, 
            txId
        ); 
      }

      return NextResponse.json({ success: true, message: "Withdrawal successful", newBalance: balanceAfter });
    } else {
      console.error("Transfer Declined:", transferResult);
      return NextResponse.json({ error: transferResult.message || "Transfer declined by provider." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("🔥 Withdrawal Error:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}