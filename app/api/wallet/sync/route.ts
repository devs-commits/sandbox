import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDepositEmail } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // 1. Fetch User Profile
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('full_name, email')
      .eq('auth_id', userId)
      .single();

    if (!userProfile) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    // 2. Get Global Balance AND the Provider Snapshot
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, last_ss_balance')
      .eq('user_id', userId)
      .single();

    const currentGlobalBalance = Number(wallet?.balance || 0);
    const lastKnownSSBalance = Number(wallet?.last_ss_balance || 0);

    // 3. Fetch live data from Supply Smart
    const res = await fetch(`${process.env.PAYMENT_BASE_URL}/partners/virtual/accounts`, {
      method: "GET",
      headers: { 
        "x-api-key": process.env.PAYMENT_API_KEY!, 
        "merchant-id": process.env.PAYMENT_MERCHANT_ID! 
      }
    });

    const responseData = await res.json();
    const walletsList = responseData?.data?.result || [];
    const providerWallet = walletsList.find((w: any) => 
      w.accountName.toUpperCase().includes(userProfile.full_name.toUpperCase())
    );

    if (!providerWallet) return NextResponse.json({ error: "Virtual account not found" }, { status: 404 });

    const liveSSBalance = Number(providerWallet.balance || 0);
    const liveAccountNumber = providerWallet.accountNumber;
    const liveBankName = providerWallet.bankName;

    /**
     * 🔥 PRODUCTION MATH LOGIC (The Snapshot Method)
     * We calculate the deposit based ONLY on the movement within the Supply Smart account.
     * New Deposit = $LiveSSBalance - LastKnownSSBalance$
     */
    const newDeposit = liveSSBalance - lastKnownSSBalance;

    // 4. Update Strategy
    const updates: any = { 
      account_number: liveAccountNumber, 
      bank_name: liveBankName, 
      updated_at: new Date().toISOString() 
    };

    if (newDeposit > 0) {
      const newGlobalBalance = currentGlobalBalance + newDeposit;
      const txRef = `SS-VIRT-${Date.now()}`;

      // Update the Global Balance AND the Snapshot
      updates.balance = newGlobalBalance;
      updates.last_ss_balance = liveSSBalance;

      await supabaseAdmin.from('wallets').update(updates).eq('user_id', userId);

      // 5. Log to Unified Ledger
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        email: userProfile.email || 'N/A',
        amount: newDeposit,
        transaction_type: 'INFLOW',
        funding_method: 'BANK_TRANSFER',
        balance_before: currentGlobalBalance,
        balance_after: newGlobalBalance,
        status: 'SUCCESS',
        reference: txRef,
        provider_tx_id: txRef,
        source: 'SUPPLY_SMART',
        created_at: new Date().toISOString()
      });

      // 6. Trigger ZeptoMail Alert (Awaited for Vercel stability)
      if (userProfile.email) {
        const firstName = userProfile.full_name.split(' ')[0] || "Intern";
        await sendDepositEmail(userProfile.email, firstName, newDeposit, newGlobalBalance, txRef);
      }
      
      console.log(`💰 Snapshot Sync: Detected ₦${newDeposit} deposit. Global Balance is now ₦${newGlobalBalance}`);

      return NextResponse.json({ 
        success: true, 
        balance: newGlobalBalance,
        accountNumber: liveAccountNumber,
        bankName: liveBankName
      });
    }

    // If no new money, just ensure bank details are synced
    await supabaseAdmin.from('wallets').update(updates).eq('user_id', userId);
    console.log(`✅ Snapshot Sync: No new funds. Bank details verified.`);

    return NextResponse.json({ 
      success: true, 
      balance: currentGlobalBalance,
      accountNumber: liveAccountNumber,
      bankName: liveBankName
    });

  } catch (err: any) {
    console.error("🔥 Sync Failure:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}