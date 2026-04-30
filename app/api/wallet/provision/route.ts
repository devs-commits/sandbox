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

    if (!userId || !bvn || !pin) {
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

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL!;

    // ==========================================
    // 🔍 STEP 1: IDENTITY VERIFICATION (KYC)
    // ==========================================
    const kycResponse = await fetch(`${baseUrl}/partners/kyc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'merchant-id': merchantId },
      body: JSON.stringify({ bvn, nin: nin || "" })
    });

    // 🔥 FIX: Safe parsing prevents HTML error page crashes
    const { data: kycData, text: rawKycText } = await safeParseJSON(kycResponse);

    if (!kycResponse.ok || !kycData?.success) {
      console.error("KYC Provider Rejection:", rawKycText);
      return NextResponse.json({ 
        success: false, 
        error: kycData?.message || "BVN verification failed at provider level" 
      }, { status: 400 });
    }

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
    const checkRes = await fetch(`${baseUrl}/partners/virtual/accounts`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'merchant-id': merchantId }
    });

    let account = null;
    if (checkRes.ok) {
      const { data: checkData } = await safeParseJSON(checkRes);
      const existing = checkData?.data?.result?.find((acc: any) => acc.email === user.email);
      if (existing) {
        account = { accountNumber: existing.accountNumber, accountName: existing.accountName };
      }
    }

    // ==========================================
    // 🏦 STEP 3: PROVISION (ONLY IF NOT FOUND)
    // ==========================================
    if (!account) {
      const provisionResponse = await fetch(`${baseUrl}/partners/dynamic/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'merchant-id': merchantId },
        body: JSON.stringify({ 
          firstName: kycData.data.firstName, 
          lastName: kycData.data.lastName,
          email: user.email,
          amount: "0" 
        })
      });

      // 🔥 FIX: Safe parsing for the actual provisioning step
      const { data: provisionData, text: rawProvText } = await safeParseJSON(provisionResponse);
      
      // If the provider rejects the payload outright
      if (!provisionResponse.ok) {
         console.error("Provisioning Rejection:", rawProvText);
         return NextResponse.json({ 
            success: false, 
            error: provisionData?.message || "Bank provider rejected account creation." 
         }, { status: 400 });
      }
      
      if (provisionData?.message?.toLowerCase().includes("already exists")) {
        const finalCheck = await fetch(`${baseUrl}/partners/virtual/accounts`, {
            method: 'GET',
            headers: { 'x-api-key': apiKey, 'merchant-id': merchantId }
        });
        const { data: finalData } = await safeParseJSON(finalCheck);
        const finalAcc = finalData?.data?.result?.find((acc: any) => acc.email === user.email);
        if (finalAcc) {
            account = { accountNumber: finalAcc.accountNumber, accountName: finalAcc.accountName };
        }
      } else {
        account = provisionData?.data?.result?.data || provisionData?.data;
      }
    }

    // 🔥 FIX: Check explicitly before trying to save
    if (!account || !account.accountNumber) {
      console.error("Failed to extract account number from provider response");
      return NextResponse.json({ success: false, error: "Failed to generate settlement account" }, { status: 502 });
    }

    // ==========================================
    // 💾 STEP 4: FINAL SYNC TO DATABASE
    // ==========================================
    const { error: userUpdateErr } = await supabaseAdmin.from('users').update({
      id_verified: true,
      bvn: bvn,
      account_number: account.accountNumber,
      account_name: account.accountName,
      bank_name: "Parallex Bank" // Adjust dynamically if provider supports multiple banks
    }).eq('auth_id', userId);

    if (userUpdateErr) throw new Error("Failed to update user profile");

    const { error: walletErr } = await supabaseAdmin.from('wallets').upsert({
      user_id: userId,
      balance: 0, 
      pin: pin,
      account_number: account.accountNumber,
      bank_name: "Parallex Bank",
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (walletErr) throw new Error("Failed to create unified wallet");

    return NextResponse.json({ 
      success: true, 
      accountNumber: account.accountNumber,
      accountName: account.accountName
    });

  } catch (error: any) {
    // 🔥 FINAL CATCH: Log the actual reason instead of a silent crash
    console.error("🔥 Global Provisioning Error:", error.message || error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}