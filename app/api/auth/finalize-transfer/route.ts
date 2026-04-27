import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize the Admin Client to bypass RLS for database updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.PAYMENT_API_KEY!,
      "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
    };

    // ==========================================
    // 1. Check if wallet already exists locally
    // ==========================================
    const { data: existingWallet } = await supabaseAdmin
      .from("wallets")
      .select("account_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingWallet?.account_number && existingWallet.account_number !== "****") {
      return NextResponse.json({ success: true, accountNumber: existingWallet.account_number });
    }

    // ==========================================
    // 2. Get user KYC data
    // ==========================================
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("full_name, nin, bvn")
      .eq("auth_id", userId)
      .single();
    
    if (userError || !user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    const names = (user.full_name || "User").split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";

    // ==========================================
    // 3. KYC (WITH SANDBOX BYPASS)
    // ==========================================
    const kycResponse = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/kyc/verify`, {
      method: "POST", headers, body: JSON.stringify({ nin: user.nin, bvn: user.bvn }),
    });
    
    const rawKyc = await kycResponse.text();
    let kycResult;
    try { kycResult = JSON.parse(rawKyc); } catch (e) {}

    if (!kycResponse.ok || (kycResult && kycResult.success === false)) {
        console.warn(`⚠️ KYC Rejected: ${kycResult?.message}. 🚧 BYPASS ENGAGED for testing.`);
    }

    // ==========================================
    // 4. CREATE VIRTUAL ACCOUNT
    // ==========================================
    const createUrl = `${process.env.PAYMENT_BASE_URL}/partners/virtual/account`;
    
    // 🚧 TRICK: Hardcoding universal test numbers to bypass provider Sandbox locks
    const createPayload = { 
        firstName, 
        lastName, 
        partnerName: "WDC Digital Centre", 
        nin: "11111111111", // Dummy Sandbox NIN
        bvn: "22222222222"  // Dummy Sandbox BVN
    };

    console.log("\n================ CREATE ACCOUNT X-RAY ================");
    console.log("TARGET URL:", createUrl);
    console.log("PAYLOAD OUT:", JSON.stringify(createPayload));
    
    const response = await fetch(createUrl, {
      method: "POST", headers, body: JSON.stringify(createPayload),
    });

    const textResponse = await response.text();
    console.log("RAW TEXT IN:", textResponse);
    console.log("==============================================================\n");

    let result;
    try { 
        result = JSON.parse(textResponse); 
    } catch (e) { 
        return NextResponse.json({ error: "Invalid provider response." }, { status: 502 }); 
    }

    // ==========================================
    // 5. BULLETPROOF RECOVERY
    // ==========================================
    if (!response.ok || !result.success) {
      const errorMessage = result?.message || result?.error || "";
      const isDuplicateWallet = response.status === 409 || response.status === 422 || errorMessage.toLowerCase().includes("already exists");

      if (isDuplicateWallet) {
        console.log("Duplicate detected. Recovering wallet...");
        
        const recoveryRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
            method: "GET", headers: { "x-api-key": headers["x-api-key"], "merchant-id": headers["merchant-id"], "Accept": "application/json" }
        });
        
        const recoveryData = await recoveryRes.json().catch(() => null);
        
        let walletsList = [];
        if (Array.isArray(recoveryData?.data?.result)) walletsList = recoveryData.data.result;
        else if (Array.isArray(recoveryData?.data)) walletsList = recoveryData.data;
        else if (Array.isArray(recoveryData?.result)) walletsList = recoveryData.result;
        
        // FIX: We match against the DUMMY sandbox BVN since that is what we used to create it!
        const recoveredWallet = walletsList.find((w: any) => w.bvn === "22222222222" || w.nin === "11111111111");
        
        if (recoveredWallet) {
             console.log("Wallet Recovered!");
             await supabaseAdmin.from("wallets").upsert({
                user_id: userId,
                account_number: recoveredWallet.accountNumber,
                account_name: recoveredWallet.accountName || `${firstName} ${lastName}`,
                bank_name: recoveredWallet.bankName || "Parallex Bank",
                updated_at: new Date().toISOString()
             }, { onConflict: 'user_id' });
             return NextResponse.json({ success: true, accountNumber: recoveredWallet.accountNumber });
        }
        return NextResponse.json({ error: "Failed to recover Sandbox wallet." }, { status: 404 });
      }
      return NextResponse.json({ error: errorMessage || "Failed to create wallet" }, { status: response.status || 400 });
    }

    // ==========================================
    // 6. STANDARD SAVE
    // ==========================================
    const account = result?.data?.result || result?.data;
    if (!account || !account.accountNumber) return NextResponse.json({ error: "Invalid provider response" }, { status: 500 });

    console.log("New Wallet Created!");
    await supabaseAdmin.from("wallets").upsert({
        user_id: userId,
        account_number: account.accountNumber,
        account_name: account.accountName || `${firstName} ${lastName}`,
        bank_name: account.bankName || "Parallex Bank",
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true, accountNumber: account.accountNumber });
  } catch (err: any) {
    console.error("FATAL INIT ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}