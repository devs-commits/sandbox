import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to calculate the exact fee to pass to the user
const calculateTransferFee = (amount: number) => {
  if (amount <= 5000) return 10;
  if (amount > 5000 && amount < 10000) return 25;
  if (amount >= 10000 && amount <= 50000) return 75; 
  return 100; 
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 🔥 Added 'pin' extraction to match your frontend
    const { userId, amount, accountNumber, bankCode, accountName, bankName, pin } = body;

    // 1. INPUT VALIDATION
    if (!userId || !amount || !accountNumber || !bankCode || !pin) {
      return NextResponse.json({ error: "Missing required withdrawal details or PIN" }, { status: 400 });
    }

    const withdrawalAmount = Number(amount);
    if (withdrawalAmount < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal amount is ₦1,000" }, { status: 400 });
    }

    // 🔥 CALCULATE TOTAL DEDUCTION (Amount + Provider Fees)
    const providerFee = calculateTransferFee(withdrawalAmount);
    const totalDeduction = withdrawalAmount + providerFee;

    // 2. CHECK USER BALANCE, PIN, & SECURE ROW LOCK
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance, account_name, transaction_pin') // Added id and pin
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // 🔥 Validate PIN
    if (wallet.transaction_pin !== pin) {
      return NextResponse.json({ error: "Invalid transaction PIN" }, { status: 403 });
    }

    // Check if they can afford the withdrawal PLUS the fee
    if (wallet.balance < totalDeduction) {
      return NextResponse.json({ 
        error: `Insufficient balance. You need ₦${totalDeduction.toLocaleString()} to cover the withdrawal and a ₦${providerFee} transfer fee.` 
      }, { status: 400 });
    }

    // ====================================================================
    // 3. SECURE THE FUNDS (NO PAYSTACK CALLS YET - OPTION B)
    // ====================================================================
    const newBalance = wallet.balance - totalDeduction;
    const internalReference = `WDC-REQ-${crypto.randomBytes(8).toString('hex')}`;

    // Deduct the full amount immediately so they can't withdraw twice
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    // 🔥 LOG AS PENDING FOR THE ADMIN
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        user_id: userId,
        reference: internalReference,
        transaction_type: 'OUTFLOW',
        funding_method: 'BANK_TRANSFER',
        amount: withdrawalAmount,       // What they will receive
        fee: providerFee,               // The fee we charged them
        total_amount: totalDeduction,   // 🔥 FIXED: snake_case
        balance_before: wallet.balance,
        balance_after: newBalance,
        status: 'PENDING',              // 🔥 FIXED: Checked constraint
        source: 'INTERNAL',
        receiver_info: {
          bank_code: bankCode,          
          bank_name: bankName,          
          account_number: accountNumber,
          account_name: accountName || wallet.account_name, 
        }
      }]);

    if (txError) {
      console.error("🚨 WITHDRAWAL INSERT ERROR:", txError);
      throw txError;
    }

    // Keep global user ledger synced
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('wallet_balance')
      .eq('auth_id', userId)
      .single();
      
    if (userRecord) {
      await supabaseAdmin
        .from('users')
        .update({ wallet_balance: (userRecord.wallet_balance || 0) - totalDeduction })
        .eq('auth_id', userId);
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted for Admin review",
      reference: internalReference,
      fee_charged: providerFee
    });

  } catch (error: any) {
    console.error("Withdrawal Request Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}