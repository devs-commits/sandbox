import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, bankCode, accountNumber, amount, accountName, nameEnquiryRef } = await req.json();

    // 1. Validation & Config
    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // 2. Prepare the payload that needs encryption
    // Based on your Postman screenshot (image_d614eb.png)
    const rawPayload = {
      amount: String(amount),
      beneficiaryAccountName: accountName,
      beneficiaryAccountNumber: String(accountNumber),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: nameEnquiryRef // 🔥 This MUST come from the Name Enquiry step
    };

    // 3. STEP ONE: Get the Encrypted Data from Supply Smart
    const encryptRes = await fetch(`${baseUrl}/partners/encrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "merchant-id": merchantId,
      },
      body: JSON.stringify(rawPayload)
    });

    const encryptResult = await encryptRes.json();
    
    if (!encryptResult.success || !encryptResult.data) {
      return NextResponse.json({ error: "Encryption failed: " + encryptResult.message }, { status: 400 });
    }

    const encryptedString = encryptResult.data; // This is the string starting with "KvQR..."

    // 4. STEP TWO: Send the Encrypted Data to the Transfer Endpoint
    const transferRes = await fetch(`${baseUrl}/partners/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "merchant-id": merchantId,
      },
      body: JSON.stringify({ data: encryptedString }) // 🔥 Send exactly like your Postman screenshot
    });

    const transferResult = await transferRes.json();

    if (transferRes.ok && transferResult.success) {
      // 5. Update Database on Success
      const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
      const newBalance = (wallet?.balance || 0) - Number(amount);

      await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
      
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        amount: Number(amount),
        transaction_type: 'OUTFLOW',
        status: 'SUCCESS',
        reference: transferResult.data?.result?.transactionId || `TRF-${Date.now()}`
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: transferResult.message || "Bank transfer declined." }, { status: 400 });
    }

    // ... imports same as before

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bankCode, accountNumber, amount, accountName, nameEnquiryRef } = body;

    // 🔥 CRITICAL FIX: Ensure no field is undefined or empty
    if (!bankCode || !accountNumber || !amount || !accountName || !nameEnquiryRef) {
      return NextResponse.json({ error: "Missing required transfer data" }, { status: 400 });
    }

    const rawPayload = {
      amount: String(amount),
      beneficiaryAccountName: accountName,
      beneficiaryAccountNumber: String(accountNumber),
      destinationInstitutionCode: String(bankCode),
      nameEnquiryRef: nameEnquiryRef
    };

    // Call Encrypt
    const encryptRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.PAYMENT_API_KEY!, "merchant-id": process.env.PAYMENT_MERCHANT_ID! },
      body: JSON.stringify(rawPayload)
    });

    const encryptData = await encryptRes.json();
    if (!encryptData.success) return NextResponse.json({ error: "Encryption failed: " + encryptData.message }, { status: 400 });

    // Call Transfer
    const transferRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.PAYMENT_API_KEY!, "merchant-id": process.env.PAYMENT_MERCHANT_ID! },
      body: JSON.stringify({ data: encryptData.data })
    });

    const transferResult = await transferRes.json();
    return NextResponse.json(transferResult);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

  } catch (err: any) {
    console.error("🔥 Transfer Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}