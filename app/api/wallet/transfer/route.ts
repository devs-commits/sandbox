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

    if (!userId || !pin || !amount || !accountNumber) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    // 1. Security Check: PIN Verification & Balance Check
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, pin')
      .eq('user_id', userId)
      .single();

    if (wallet?.pin !== pin) {
      return NextResponse.json({ error: "Incorrect Security PIN." }, { status: 403 });
    }

    const balanceBefore = Number(wallet?.balance || 0);
    if (balanceBefore < Number(amount)) {
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // 2. Encrypt Payload for Supply Smart
    const rawPayload = {
      amount: String(amount),
      beneficiaryAccountName: accountName,
      beneficiaryAccountNumber: String(accountNumber),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: nameEnquiryRef,
      narration: "WDC Wallet Withdrawal",
      currency: "NGN" 
    };

    const encryptRes = await fetch(`${baseUrl}/partners/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify(rawPayload)
    });

    const encryptData = await encryptRes.json();
    if (!encryptData.success) throw new Error("Encryption failed");

    // 3. Execute Encrypted Transfer
    const transferRes = await fetch(`${baseUrl}/partners/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "merchant-id": merchantId },
      body: JSON.stringify({ data: encryptData.data.result || encryptData.data }) 
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.success) {
      const balanceAfter = balanceBefore - Number(amount);
      const txId = transferResult.data?.result?.transactionId || `SS-${Date.now()}`;

      // 4. Update Ledger & Balance
      await supabaseAdmin.from('wallets').update({ balance: balanceAfter }).eq('user_id', userId);
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        amount: Number(amount),
        transaction_type: 'OUTFLOW',
        status: 'SUCCESS', 
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: txId,
        source: `Withdrawal to ${bankName}`
      });

      // 5. Notify User
      const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('auth_id', userId).single();
      if (user?.email) {
        await sendWithdrawalEmail(user.email, user.full_name.split(' ')[0], Number(amount), balanceAfter, bankName, accountName, accountNumber, txId); 
      }

      return NextResponse.json({ success: true, message: "Withdrawal successful" });
    } else {
      return NextResponse.json({ error: transferResult.message || "Transfer declined." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("🔥 Withdrawal Error:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}