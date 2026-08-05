import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, page = 1, limit = 15 } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Fetch live balance and account info from the local wallets table
    const { data: walletData, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('balance, account_number')
        .eq('user_id', userId)
        .single();

    if (walletError || !walletData) {
        return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    }

    // 2. Fetch transactions from local ledger
    let { data: transactions, count, error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (txError) {
        console.error("🔴 Local Ledger Fetch Error:", txError.message);
        throw new Error("Failed to fetch transactions");
    }

    // 🔥 SELF-HEALING PATCH: If wallet has a balance but ledger is empty, seed a baseline transaction
    if ((!transactions || transactions.length === 0) && walletData.balance > 0) {
        const seedTx = {
            user_id: userId,
            reference: `seed_${Date.now()}`,
            transaction_type: 'INFLOW',
            amount: walletData.balance,
            status: 'SUCCESS', // 🔥 FIXED: Changed from COMPLETED to SUCCESS
            source: 'PAYSTACK'
            // 🔥 FIXED: Removed 'description' completely to match your DB schema
        };

        const { error: seedError } = await supabaseAdmin.from('wallet_transactions').insert([seedTx]);
        
        if (seedError) {
           console.error("🚨 SUPABASE SEED ERROR:", seedError); // This will show in VS Code if it fails!
        }
        
        // Re-fetch transactions
        const refetched = await supabaseAdmin
            .from('wallet_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        transactions = refetched.data || [];
        count = refetched.count || 1;
    }

    const totalItems = count || transactions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;

    return NextResponse.json({ 
      success: true, 
      transactions: transactions || [],
      balance: walletData.balance || 0,
      accountNumber: walletData.account_number,
      pagination: { hasNext, totalPages },
      isLocalFallback: false 
    });

  } catch (error: any) {
    console.error("🔥 Fatal Ledger Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}