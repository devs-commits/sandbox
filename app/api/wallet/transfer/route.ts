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

    if (!userId || !pin || !amount || !accountNumber || !bankCode || !nameEnquiryRef) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    // 1. LOCAL SECURITY CHECK: Verify PIN
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, transaction_pin, account_number')
      .eq('user_id', userId)
      .single();

    if (!wallet) return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    if (wallet.transaction_pin !== pin) return NextResponse.json({ error: "Incorrect Security PIN." }, { status: 403 });

    const withdrawAmount = Number(amount);
    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const wdcBase = process.env.PAYMENT_BASE_URL; // lab-api.wdc.ng/api/v1
    const supplySmart = process.env.STANDALONE_PAYMENT_BASE_URL; // Cloudfront

    // ==========================================
    // 2. LIVE PROVIDER BALANCE CHECK
    // ==========================================
    // 🔥 Uses the timeout helper
    const balanceRes = await fetchWithTimeout(`${wdcBase}/virtual-wallet?accountNumber=${wallet.account_number}`, {
      method: "GET",
      headers: { "x-api-key": apiKey, "merchant-id": merchantId }
    });

    const balanceData = await balanceRes.json();
    const liveBalance = balanceData?.data?.result?.[0]?.availableBalance || 0;

    if (Number(liveBalance) < withdrawAmount) {
      return NextResponse.json({ 
        error: `Insufficient funds on provider. Live: ₦${liveBalance}, Request: ₦${withdrawAmount}` 
      }, { status: 400 });
    }

    // ==========================================
    // 3. ENCRYPT PAYLOAD (Cloudfront URL)
    // ==========================================
    const rawPayload = {
      amount: String(withdrawAmount),
      beneficiaryAccountNumber: String(accountNumber),
      beneficiaryAccountName: String(accountName),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: String(nameEnquiryRef)
    };

    // 🔥 Uses the timeout helper
    const encryptRes = await fetchWithTimeout(`${supplySmart}/partners/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify(rawPayload)
    });

    const encryptData = await encryptRes.json();
    if (!encryptRes.ok || !encryptData.success) {
      return NextResponse.json({ error: "Encryption failed." }, { status: 500 });
    }

    // ==========================================
    // 4. EXECUTE TRANSFER (Lab API URL)
    // ==========================================
    // 🔥 Uses the timeout helper
    const transferRes = await fetchWithTimeout(`${wdcBase}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify({ 
        originatorAccountNumber: wallet.account_number,
        data: encryptData.data.result 
      }) 
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.success) {
      // 5. UPDATE LOCAL DB AFTER SUCCESS
      const balanceAfter = Number(wallet.balance) - withdrawAmount;
      const txId = transferResult.data?.transactionId || `WTH-${Date.now()}`;

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
        source: `Withdrawal to ${bankName}`,
        created_at: new Date().toISOString()
      });

      // 6. NOTIFY USER
      const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('auth_id', userId).single();
      if (user?.email) {
        await sendWithdrawalEmail(user.email, user.full_name.split(' ')[0], withdrawAmount, balanceAfter, bankName, accountName, accountNumber, txId); 
      }

      return NextResponse.json({ success: true, message: "Withdrawal successful", newBalance: balanceAfter });
    } else {
      return NextResponse.json({ error: transferResult.message || "Transfer declined." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("🔥 Withdrawal Error:", err.message);
    
    // Check if it was our custom timeout error
    if (err.message.includes("Provider timeout")) {
      return NextResponse.json({ error: err.message }, { status: 504 });
    }
    
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}