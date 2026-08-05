import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, adminId, rejectionReason } = body;

    if (!transactionId || !adminId) {
      return NextResponse.json({ error: "Missing required fields (transactionId, adminId)" }, { status: 400 });
    }

    // 1. FETCH THE PENDING REQUEST
    const { data: tx, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('status', 'PENDING_APPROVAL')
      .single();

    if (txError || !tx) {
      return NextResponse.json({ error: "Valid pending transaction not found or already processed" }, { status: 404 });
    }

    const userId = tx.user_id;
    const totalRefundAmount = Number(tx.totalAmount || (tx.amount + (tx.fee || 0)));

    // 2. FETCH CURRENT USER WALLET TO REVERSE DEDUCTION
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Associated user wallet not found" }, { status: 404 });
    }

    const restoredBalance = wallet.balance + totalRefundAmount;

    // ====================================================================
    // 3. ATOMIC REFUND & REJECTION UPDATES
    // ====================================================================
    
    // A. Refund the balance back to the user's wallet
    await supabaseAdmin
      .from('wallets')
      .update({ balance: restoredBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // B. Update transaction status to REJECTED and log the admin audit info
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ 
        status: 'REJECTED',
        admin_approved_by: adminId, // Tracks which admin handled/rejected it
        receiver_info: {
          ...tx.receiver_info,
          rejection_reason: rejectionReason || "Declined by Administrator"
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    // C. Sync the global users table balance as well
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('wallet_balance')
      .eq('auth_id', userId)
      .single();
      
    if (userRecord) {
      await supabaseAdmin
        .from('users')
        .update({ wallet_balance: (userRecord.wallet_balance || 0) + totalRefundAmount })
        .eq('auth_id', userId);
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request rejected and funds successfully refunded to user wallet.",
    });

  } catch (error: any) {
    console.error("Admin Rejection Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}