import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to safely parse potential HTML error pages into JSON
const safeParseJSON = async (response: Response) => {
  const text = await response.text();
  try {
    return { data: JSON.parse(text), text };
  } catch (e) {
    return { data: null, text };
  }
};

export async function POST(req: Request) {
  try {
    const { userId, bvn, nin, pin } = await req.json();

    if (!userId || !pin) { // Note: Paystack doesn't strictly mandate BVN/NIN for basic DVA creation depending on your compliance tier, but keep your frontend validation!
      return NextResponse.json({ success: false, error: "Missing required information" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', userId)
      .single();

    if (userError || !user) {
        return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }

    /* =============================================================================
    🛑 SUPPLY SMART LOGIC COMMENTED OUT FOR PAYSTACK MIGRATION (DO NOT DELETE)
    =============================================================================
    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // STEP 1: IDENTITY VERIFICATION (KYC)
    const kycResponse = await fetch(`${baseUrl}/partners/kyc/verify`, ...);
    ...
    // STEP 2: PROACTIVE ACCOUNT RECOVERY
    const checkRes = await fetch(`${baseUrl}/partners/virtual/accounts`, ...);
    ...
    // STEP 3: PROVISION (ONLY IF NOT FOUND)
    const provisionResponse = await fetch(`${baseUrl}/partners/dynamic/account`, ...);
    ...
    =============================================================================
    */

    // ==========================================
    // 🟢 PAYSTACK STEP 1: CREATE OR FETCH CUSTOMER
    // ==========================================
    const paystackKey = process.env.PAYSTACK_SECRET_KEY!;
    if (!paystackKey) throw new Error("Missing PAYSTACK_SECRET_KEY in environment variables.");

    const nameParts = user.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'WDC-User';

    const customerRes = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        first_name: firstName,
        last_name: lastName
      })
    });

    const customerData = await customerRes.json();
    
    // Paystack returns 200/True even if the customer already exists, so we just grab the customer code.
    if (!customerData.status) {
      console.error("Paystack Customer Creation Failed:", customerData.message);
      return NextResponse.json({ success: false, error: "Failed to register user on payment gateway." }, { status: 400 });
    }

    const customerCode = customerData.data.customer_code;

    // ==========================================
    // 🟢 PAYSTACK STEP 2: PROVISION DVA (VIRTUAL WALLET)
    // ==========================================
    // Paystack automatically provisions a Titan Trust or Wema bank account depending on your dashboard settings
    const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerCode
      })
    });

    const dvaData = await dvaRes.json();
    let account = null;

    if (dvaData.status) {
       account = {
          accountNumber: dvaData.data.account_number,
          accountName: dvaData.data.account_name,
          bankName: dvaData.data.bank.name
       };
    } else if (dvaData.message.toLowerCase().includes('already has')) {
       // Proactive Recovery: If they already have an account, fetch it!
       const listDvaRes = await fetch(`https://api.paystack.co/dedicated_account?customer=${customerCode}`, {
         method: 'GET',
         headers: { Authorization: `Bearer ${paystackKey}` }
       });
       const listDvaData = await listDvaRes.json();
       
       if (listDvaData.status && listDvaData.data.length > 0) {
         account = {
            accountNumber: listDvaData.data[0].account_number,
            accountName: listDvaData.data[0].account_name,
            bankName: listDvaData.data[0].bank.name
         };
       }
    }

    if (!account || !account.accountNumber) {
      console.error("Paystack DVA Failed:", dvaData);
      return NextResponse.json({ success: false, error: "Failed to generate Paystack virtual account" }, { status: 502 });
    }

    // ==========================================
    // 💾 STEP 4: FINAL SYNC TO DATABASE
    // ==========================================
    const { error: userUpdateErr } = await supabaseAdmin.from('users').update({
      id_verified: true, // You might want to tie this to actual Paystack BVN validation later
      bvn: bvn,
      account_number: account.accountNumber,
      account_name: account.accountName,
      bank_name: account.bankName 
    }).eq('auth_id', userId);

    if (userUpdateErr) throw new Error("Failed to update user profile");

    const { error: walletErr } = await supabaseAdmin.from('wallets').upsert({
      user_id: userId,
      balance: 0, 
      pin: pin,
      account_number: account.accountNumber,
      bank_name: account.bankName,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (walletErr) throw new Error("Failed to create unified wallet");

    return NextResponse.json({ 
      success: true, 
      accountNumber: account.accountNumber,
      accountName: account.accountName
    });

  } catch (error: any) {
    console.error("🔥 Global Provisioning Error:", error.message || error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}