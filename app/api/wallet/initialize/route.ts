import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 🔥 FIX 1: Extracted the PIN from the request body
    const { userId, pin } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.PAYMENT_API_KEY!,
      "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
    };

    const wdcBase = "https://lab-api.wdc.ng/api/v1";
    const supplySmartBase = process.env.STANDALONE_PAYMENT_BASE_URL || "https://d9o8urztf23tc.cloudfront.net/api/v1";

    // --- 1. LOCAL CACHE CHECK ---
    const { data: localWallet } = await supabaseAdmin
      .from("wallets")
      .select("account_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (localWallet?.account_number && localWallet.account_number !== "****") {
      console.log("Serving wallet from local cache.");
      return NextResponse.json({ success: true, accountNumber: localWallet.account_number });
    }

    // --- 2. GET USER KYC DATA FROM SUPABASE ---
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("full_name, nin, bvn")
      .eq("auth_id", userId)
      .single();
    
    if (userError || !user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    // --- 3. IDENTITY VERIFICATION (WDC) ---
    console.log(`Verifying identity for user: ${userId}`);
    const verifyRes = await fetch(`${wdcBase}/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        ...(user.bvn ? { BVN: user.bvn } : { NIN: user.nin })
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ 
        error: verifyData.message || "Identity verification failed. Please check your BVN/NIN." 
      }, { status: 400 });
    }

    const official = verifyData.data.bvn || verifyData.data.nin;
    const firstName = official.firstName;
    const lastName = official.lastName;
    const targetName = `${firstName} ${lastName}`.toLowerCase();

    // --- 4. EXHAUSTIVE PROVIDER SEARCH ---
    console.log(`Searching provider records for ${targetName}...`);
    
    const [ssResponse, wdcResponse] = await Promise.all([
      fetch(`${supplySmartBase}/partners/virtual/accounts?limit=1000`, { method: "GET", headers }),
      fetch(`${wdcBase}/get-all-virtual-wallet?limit=1000`, { method: "GET", headers })
    ]);

    const ssData = await ssResponse.json().catch(() => ({}));
    const wdcData = await wdcResponse.json().catch(() => ({}));

    const allWallets = [
      ...(Array.isArray(ssData?.data?.result) ? ssData.data.result : []),
      ...(Array.isArray(wdcData?.data) ? wdcData.data : [])
    ];

    const recoveredWallet = allWallets.find((w: any) => {
        const apiBvn = String(w.bvn || w.bvn_number || "");
        const apiNin = String(w.nin || w.nin_number || "");
        const apiName = String(w.accountName || w.account_name || "").toLowerCase();

        return (apiBvn === String(user.bvn) && user.bvn) || 
               (apiNin === String(user.nin) && user.nin) ||
               apiName.includes(targetName);
    });

    let finalAccount;

    if (recoveredWallet) {
      console.log("Wallet found in provider records. Recovering...");
      finalAccount = recoveredWallet;
    } else {
      // --- 5. ATTEMPT ACCOUNT CREATION ---
      console.log("No existing wallet found. Creating new account...");
      const createRes = await fetch(`${supplySmartBase}/partners/virtual/account`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          partnerName: "WDC Digital Centre", 
          nin: user.nin, 
          bvn: user.bvn 
        }),
      });

      const createResult = await createRes.json();
      
      if (!createRes.ok || !createResult.success) {
        return NextResponse.json({ 
            error: createResult.message || "Provider refused creation request." 
        }, { status: createRes.status || 400 });
      }
      
      finalAccount = createResult.data.result || createResult.data;
    }

    // --- 6. SYNC TO SUPABASE ---
    if (finalAccount && (finalAccount.accountNumber || finalAccount.account_number)) {
        const accNum = finalAccount.accountNumber || finalAccount.account_number;
        
        // 🔥 FIX 2: Added transaction_pin to the upsert object to bypass RLS!
        await supabaseAdmin.from("wallets").upsert({
            user_id: userId,
            account_number: accNum,
            account_name: finalAccount.accountName || finalAccount.account_name || `${firstName} ${lastName}`,
            bank_name: finalAccount.bankName || finalAccount.bank_name || "Parallex Bank",
            transaction_pin: pin, // Secure admin PIN save
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        await supabaseAdmin.from("users").update({ is_complete: true }).eq("auth_id", userId);

        return NextResponse.json({ success: true, accountNumber: accNum });
    }

    return NextResponse.json({ error: "Could not resolve wallet account details." }, { status: 500 });

  } catch (err: any) {
    console.error("CRITICAL WALLET INIT ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}