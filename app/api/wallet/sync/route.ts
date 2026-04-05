import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // 1. Get the user's registered name to identify their wallet on the provider side
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('auth_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 2. Fetch all virtual accounts from Supply Smart
    const res = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PAYMENT_API_KEY!,
        "merchant-id": process.env.PAYMENT_MERCHANT_ID!,
      }
    });

    const responseData = await res.json();
    const walletsList = responseData?.data?.result || [];

    // 3. Find the specific wallet by matching the User's Name in the accountName field
    // Supply Smart typically formats it as "Name - WDC Digital Centre"
    const providerWallet = walletsList.find((w: any) => 
      w.accountName.toUpperCase().includes(userProfile.full_name.toUpperCase())
    );

    if (!providerWallet) {
      console.error(`❌ Sync: No provider wallet found for ${userProfile.full_name}`);
      return NextResponse.json({ error: "Virtual account not found on provider" }, { status: 404 });
    }

    const liveBalance = Number(providerWallet.balance || 0);
    const liveAccountNumber = providerWallet.accountNumber;
    const liveBankName = providerWallet.bankName;

    // 4. REPAIR & UPDATE: Overwrite whatever is in the local DB with the truth from Supply Smart
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: liveBalance, 
        account_number: liveAccountNumber, // 🔥 Fixes the GTBank overwrite
        bank_name: liveBankName,           // 🔥 Resets to Parallex Bank
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`✅ Wallet Repaired & Synced for ${userProfile.full_name}`);

    return NextResponse.json({ 
      success: true, 
      balance: liveBalance,
      accountNumber: liveAccountNumber,
      bankName: liveBankName
    });

  } catch (err: any) {
    console.error("🔥 Sync Failure:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}