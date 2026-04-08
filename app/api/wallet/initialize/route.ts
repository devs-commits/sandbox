import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    if (!process.env.PAYMENT_BASE_URL || !process.env.PAYMENT_API_KEY || !process.env.PAYMENT_MERCHANT_ID) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // ==========================================
    // 1. Check if wallet already exists locally in wallets table
    // ==========================================
    const { data: existingWallet } = await supabaseAdmin!
      .from("wallets")
      .select("account_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingWallet?.account_number && existingWallet.account_number !== "****") {
      return NextResponse.json({ success: true, accountNumber: existingWallet.account_number });
    }

    // 2. Get user KYC data
    const { data: user, error: userError } = await supabaseAdmin!
      .from("users")
      .select("full_name, nin, bvn")
      .eq("auth_id", userId)
      .single();
    
    if (userError || !user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    if (!user.nin || !user.bvn) return NextResponse.json({ error: "NIN and BVN required" }, { status: 400 });

    const names = (user.full_name || "User").split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "User";

    // 3. Call Supply Smart API to Create
    const response = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      },
      body: JSON.stringify({ firstName, lastName, partnerName: "WDC Digital Centre", nin: user.nin, bvn: user.bvn }),
    });

    const textResponse = await response.text();
    let result;
    try { result = JSON.parse(textResponse); } 
    catch (e) { return NextResponse.json({ error: "Invalid provider response." }, { status: 502 }); }

    // ==========================================
    // 👻 4. BULLETPROOF RECOVERY LOGIC (UPDATED)
    // ==========================================
    if (!response.ok) {
      const errorMessage = result?.message || result?.error || "";
      const isDuplicateWallet = response.status === 409 || response.status === 422 || errorMessage.toLowerCase().includes("already exists");

      if (isDuplicateWallet) {
        console.log("👻 Duplicate detected. Fetching ALL partner wallets to recover...");
        try {
          // 🔥 FIX: Using the plural /accounts endpoint
          const recoveryRes = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
            method: "GET",
            headers: { 
              "x-api-key": process.env.PAYMENT_API_KEY!.trim(), 
              "merchant-id": process.env.PAYMENT_MERCHANT_ID!.trim(),
              "Accept": "application/json"
            }
          });
          
          const recoveryText = await recoveryRes.text();
          console.log(`🔍 Recovery API Status: ${recoveryRes.status}`);

          if (!recoveryText) {
             return NextResponse.json({ error: "Provider returned empty data." }, { status: 502 });
          }

          let recoveryData;
          try {
            recoveryData = JSON.parse(recoveryText);
          } catch (parseError) {
             return NextResponse.json({ error: "Provider returned invalid JSON." }, { status: 502 });
          }

          // Safely extract the array
          let walletsList: any[] = [];
          if (Array.isArray(recoveryData)) walletsList = recoveryData;
          else if (Array.isArray(recoveryData?.data)) walletsList = recoveryData.data;
          else if (Array.isArray(recoveryData?.data?.result)) walletsList = recoveryData.data.result;
          else if (Array.isArray(recoveryData?.result)) walletsList = recoveryData.result;

          if (!Array.isArray(walletsList) || walletsList.length === 0) {
              console.error("❌ Recovery Failed: Could not parse wallet array.");
              throw new Error("Provider returned an unreadable wallet list structure.");
          }

          // 🔥 Match purely by BVN or NIN
          const recoveredWallet = walletsList.find((w: any) => w.bvn === user.bvn || w.nin === user.nin);
          
          if (recoveredWallet) {
             console.log("✅ Wallet Recovered! Saving to wallets table...");
             
             const { error: recoveryUpdateError } = await supabaseAdmin!.from("wallets").upsert({
                user_id: userId,
                account_number: recoveredWallet.accountNumber,
                account_name: recoveredWallet.accountName || `${firstName} ${lastName}`,
                bank_name: recoveredWallet.bankName || "Parallex Bank",
                updated_at: new Date().toISOString()
             }, { onConflict: 'user_id' });

             if (recoveryUpdateError) throw recoveryUpdateError;

             return NextResponse.json({ success: true, accountNumber: recoveredWallet.accountNumber });
          } else {
             console.error("❌ BVN/NIN not found in the recovered wallets list.");
             return NextResponse.json({ error: "Wallet exists but could not be matched." }, { status: 404 });
          }
        } catch (err: any) {
          console.error("❌ Recovery Error:", err.message);
          return NextResponse.json({ error: "Failed to recover wallet." }, { status: 500 });
        }
      }
      return NextResponse.json({ error: errorMessage || "Failed to create wallet" }, { status: response.status });
    }

    // ==========================================
    // 5. STANDARD SAVE (For Brand New Wallets)
    // ==========================================
    const account = result?.data?.result || result?.data;
    if (!account || !account.accountNumber) return NextResponse.json({ error: "Invalid provider response" }, { status: 500 });

    console.log("✅ New Wallet Created! Saving to wallets table...");
    
    const { error: newUpdateError } = await supabaseAdmin!.from("wallets").upsert({
        user_id: userId,
        account_number: account.accountNumber,
        account_name: account.accountName || `${firstName} ${lastName}`,
        bank_name: account.bankName || "Parallex Bank",
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (newUpdateError) {
       console.error("❌ DB SAVE FAILED (New Wallet):", newUpdateError.message);
       return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, accountNumber: account.accountNumber });

  } catch (err: any) {
    console.error("❌ FATAL INIT ERROR:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}