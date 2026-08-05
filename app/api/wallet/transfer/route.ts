import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalEmail } from "@/lib/zeptomail"; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔥 HELPER: Protects your app from hanging if the bank API goes down
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("Provider timeout: The banking service took too long to respond.");
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bankCode, bankName, accountNumber, amount, accountName, nameEnquiryRef, pin } = body;

    if (!userId || !pin || !amount || !accountNumber || !bankCode) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    // 1. LOCAL SECURITY CHECK: Verify PIN & Balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, transaction_pin, account_number')
      .eq('user_id', userId)
      .single();

    if (!wallet) return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    if (wallet.transaction_pin !== pin) return NextResponse.json({ error: "Incorrect Security PIN." }, { status: 403 });

    const withdrawAmount = Number(amount);
    
    // Ensure they have enough funds in their local WDC wallet
    if (Number(wallet.balance) < withdrawAmount) {
      return NextResponse.json({ 
        error: `Insufficient funds. Your balance is ₦${wallet.balance}, but you requested ₦${withdrawAmount}` 
      }, { status: 400 });
    }

    /* =============================================================================
    🛑 SUPPLY SMART ENCRYPTION LOGIC COMMENTED OUT (DO NOT DELETE)
    =============================================================================
    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const wdcBase = process.env.PAYMENT_BASE_URL; 
    const supplySmart = process.env.STANDALONE_PAYMENT_BASE_URL;

    // 2. LIVE PROVIDER BALANCE CHECK
    const balanceRes = await fetchWithTimeout(`${wdcBase}/virtual-wallet?accountNumber=${wallet.account_number}`, ...);
    ...
    // 3. ENCRYPT PAYLOAD
    const rawPayload = { ... };
    const encryptRes = await fetchWithTimeout(`${supplySmart}/partners/encrypt`, ...);
    ...
    // 4. EXECUTE TRANSFER
    const transferRes = await fetchWithTimeout(`${wdcBase}/transfer`, ...);
    ============================================================================= */

    // ==========================================
    // 🟢 PAYSTACK ERA: DIRECT TRANSFER
    // ==========================================
    const paystackKey = process.env.PAYSTACK_SECRET_KEY!;
    if (!paystackKey) throw new Error("Missing PAYSTACK_SECRET_KEY");

    const amountInKobo = withdrawAmount * 100; // Paystack requires amounts in Kobo

    // STEP A: CREATE TRANSFER RECIPIENT
    const recipientRes = await fetchWithTimeout("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN"
      })
    });

    const recipientData = await recipientRes.json();

    if (!recipientData.status) {
      console.error("Paystack Recipient Error:", recipientData);
      return NextResponse.json({ error: recipientData.message || "Failed to resolve destination bank account." }, { status: 400 });
    }

    const recipientCode = recipientData.data.recipient_code;

    // STEP B: INITIATE TRANSFER
    const transferRes = await fetchWithTimeout("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "balance", 
        amount: amountInKobo,
        recipient: recipientCode,
        reason: `WDC Labs Withdrawal`
      })
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.status) {
      // 5. UPDATE LOCAL DB AFTER SUCCESS
      const balanceAfter = Number(wallet.balance) - withdrawAmount;
      const txId = transferResult.data?.reference || `WTH-${Date.now()}`;

      await supabaseAdmin
        .from('wallets')
        .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
        
      await supabaseAdmin.from('wallet_transactions').upsert({
        user_id: userId,
        amount: withdrawAmount,
        transaction_type: 'OUTFLOW',
        status: 'SUCCESS', // Or 'PENDING' depending on if Paystack queues it
        reference: txId,
        source: `Withdrawal to ${bankName}`,
        created_at: new Date().toISOString()
      });

      // 6. NOTIFY USER VIA ZEPTOMAIL
      const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('auth_id', userId).single();
      if (user?.email) {
        await sendWithdrawalEmail(user.email, user.full_name.split(' ')[0], withdrawAmount, balanceAfter, bankName, accountName, accountNumber, txId); 
      }

      return NextResponse.json({ success: true, message: "Withdrawal successful", newBalance: balanceAfter });
    } else {
      console.error("Paystack Transfer Failed:", transferResult);
      return NextResponse.json({ error: transferResult.message || "Transfer declined by provider." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("🔥 Withdrawal Error:", err.message);
    if (err.message.includes("Provider timeout")) {
      return NextResponse.json({ error: err.message }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}