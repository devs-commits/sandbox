import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.PAYMENT_API_KEY!,
      "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
    };

    const supplySmartBase = process.env.STANDALONE_PAYMENT_BASE_URL;

    // --- 1. LOCAL CACHE CHECK ---
    // Why hit the API if we already have the data? 
    const { data: localWallet } = await supabaseAdmin
      .from("wallets")
      .select("account_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (localWallet?.account_number && localWallet.account_number !== "****") {
      return NextResponse.json({ success: true, accountNumber: localWallet.account_number });
    }

    // --- 2. RETRIEVE KYC DATA ---
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("full_name, nin, bvn")
      .eq("auth_id", userId)
      .single();
    
    if (userError || !user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    const names = (user.full_name || "User").split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";
    const targetName = `${firstName} ${lastName}`.toLowerCase();

    // --- 3. ATTEMPT ACCOUNT CREATION ---
    const createUrl = `${supplySmartBase}/partners/virtual/account`;
    const response = await fetch(createUrl, {
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

    const textResponse = await response.text();
    let result;
    try { result = JSON.parse(textResponse); } catch (e) { result = {}; }

    // --- 4. ERROR & DUPLICATE HANDLING ---
    const errorMessage = result?.message || "";
    const isDuplicate = !response.ok && (
        result?.success === false || 
        errorMessage.toLowerCase().includes("already exists") ||
        response.status === 409 || 
        response.status === 422
    );

    if (response.ok || isDuplicate) {
      if (isDuplicate) console.log("Duplicate detected. Recovering wallet details...");

      // Fetch the full merchant list to find the "Ghost Wallet"
      const recoveryRes = await fetch(`${supplySmartBase}/partners/virtual/accounts`, {
          method: "GET", 
          headers: { ...headers, "Accept": "application/json" }
      });
      
      const recoveryData = await recoveryRes.json().catch(() => null);
      
      let walletsList: any[] = [];
      if (Array.isArray(recoveryData?.data?.result)) walletsList = recoveryData.data.result;
      else if (Array.isArray(recoveryData?.data)) walletsList = recoveryData.data;
      else if (Array.isArray(recoveryData?.result)) walletsList = recoveryData.result;

      // Defensive Matching (String-based to ignore type mismatches)
      const recoveredWallet = walletsList.find((w: any) => {
          const apiBvn = String(w.bvn || w.bvn_number || "");
          const apiNin = String(w.nin || w.nin_number || "");
          const apiName = String(w.accountName || w.account_name || "").toLowerCase();
          
          const userBvn = String(user.bvn || "");
          const userNin = String(user.nin || "");

          return (apiBvn === userBvn && userBvn !== "") || 
                 (apiNin === userNin && userNin !== "") || 
                 apiName.includes(targetName);
      });

      if (recoveredWallet || (response.ok && result?.data)) {
           const account = recoveredWallet || result.data.result || result.data;
           
           // --- 5. SYNC TO DATABASE ---
           await supabaseAdmin.from("wallets").upsert({
              user_id: userId,
              account_number: account.accountNumber,
              account_name: account.accountName || `${firstName} ${lastName}`,
              bank_name: account.bankName || "SupplySmart Partner Bank",
              updated_at: new Date().toISOString()
           }, { onConflict: 'user_id' });

           // Mark onboarding as complete
           await supabaseAdmin.from("users").update({ is_complete: true }).eq("auth_id", userId);

           return NextResponse.json({ success: true, accountNumber: account.accountNumber });
      }

      if (isDuplicate) {
          return NextResponse.json({ 
            error: "Wallet exists but was not found in the retrieval list. Please contact support." 
          }, { status: 404 });
      }
    }

    return NextResponse.json({ 
        error: errorMessage || "Provider refused request." 
    }, { status: response.status || 400 });

  } catch (err: any) {
    console.error("CRITICAL INIT ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}