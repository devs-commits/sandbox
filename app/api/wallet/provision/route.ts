import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, bvn, nin, pin } = await req.json();

    if (!userId || !bvn || !pin) {
      return NextResponse.json({ success: false, error: "Missing required information" }, { status: 400 });
    }

    // 1. Fetch User's Registered Name and Email from DB
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', userId)
      .single();

    if (userError || !user) throw new Error("User profile not found");

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // ==========================================
    // 🔍 STEP 1: IDENTITY VERIFICATION (KYC)
    // ==========================================
    // We still do this to ensure the person testing actually owns the BVN
    const kycResponse = await fetch(`${baseUrl}/partners/kyc/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'merchant-id': merchantId
      },
      body: JSON.stringify({ bvn, nin: nin || "" })
    });

    const kycData = await kycResponse.json();

    if (!kycData.success) {
      return NextResponse.json({ success: false, error: kycData.message || "BVN verification failed" }, { status: 400 });
    }

    // STRICT NAME MATCHING
    const registeredName = user.full_name.toLowerCase();
    const bankFirstName = (kycData.data?.firstName || "").toLowerCase();
    const bankLastName = (kycData.data?.lastName || "").toLowerCase();

    if (!registeredName.includes(bankFirstName) && !registeredName.includes(bankLastName)) {
      return NextResponse.json({ 
        success: false, 
        error: `Identity Mismatch: The name on this BVN does not match your WDC profile (${user.full_name}).` 
      }, { status: 400 });
    }

    // ==========================================
    // ♻️ STEP 2: PROACTIVE ACCOUNT RECOVERY
    // ==========================================
    // Before creating, check if this email already has a virtual account on Supply Smart
    console.log("Checking for existing account on Supply Smart...");
    const checkRes = await fetch(`${baseUrl}/partners/virtual/accounts`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'merchant-id': merchantId }
    });

    let account = null;
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const existing = checkData?.data?.result?.find((acc: any) => acc.email === user.email);
      if (existing) {
        console.log("♻️ Found existing live account. Re-linking...");
        account = {
          accountNumber: existing.accountNumber,
          accountName: existing.accountName
        };
      }
    }

    // ==========================================
    // 🏦 STEP 3: PROVISION (ONLY IF NOT FOUND)
    // ==========================================
    if (!account) {
      console.log("🆕 No existing account found. Provisioning new one...");
      const provisionResponse = await fetch(`${baseUrl}/partners/dynamic/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'merchant-id': merchantId
        },
        body: JSON.stringify({ 
          firstName: kycData.data.firstName, 
          lastName: kycData.data.lastName,
          email: user.email,
          amount: "0" 
        })
      });

      const provisionData = await provisionResponse.json();
      
      // Handle the case where the API says it exists even if our check missed it
      if (provisionData.message?.toLowerCase().includes("already exists")) {
        // One last attempt to fetch the accounts list if the provision fails with "exists"
        const finalCheck = await fetch(`${baseUrl}/partners/virtual/accounts`, {
            method: 'GET',
            headers: { 'x-api-key': apiKey, 'merchant-id': merchantId }
        });
        const finalData = await finalCheck.json();
        const finalAcc = finalData?.data?.result?.find((acc: any) => acc.email === user.email);
        if (finalAcc) {
            account = { accountNumber: finalAcc.accountNumber, accountName: finalAcc.accountName };
        }
      } else {
        account = provisionData?.data?.result?.data || provisionData?.data;
      }
    }

    if (!account?.accountNumber) {
      return NextResponse.json({ success: false, error: "Failed to generate or recover settlement account" }, { status: 502 });
    }

    // ==========================================
    // 💾 STEP 4: FINAL SYNC TO DATABASE
    // ==========================================
    
    // Update Users Table
    const { error: userUpdateErr } = await supabaseAdmin.from('users').update({
      id_verified: true,
      bvn: bvn,
      account_number: account.accountNumber,
      account_name: account.accountName,
      bank_name: "Parallex Bank"
    }).eq('auth_id', userId);

    if (userUpdateErr) throw userUpdateErr;

    // Update Wallet Table & PIN
    const { error: walletErr } = await supabaseAdmin.from('wallets').upsert({
      user_id: userId,
      balance: 0, // Resetting local balance is fine, the 'history' route will sync it back
      pin: pin,
      account_number: account.accountNumber,
      bank_name: "Parallex Bank",
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (walletErr) throw walletErr;

    return NextResponse.json({ 
      success: true, 
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      recovered: !!(account as any).recovered 
    });

  } catch (error: any) {
    console.error("🔥 Provisioning Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}