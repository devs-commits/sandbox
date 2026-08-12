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
        .maybeSingle(); // 🔥 Changed to maybeSingle so it doesn't crash if empty

    // 🔥 THE FIX: Don't throw a 404 if the wallet is missing (like during a reset). Just return empty!
    if (walletError || !walletData) {
        return NextResponse.json({ 
          success: true, 
          transactions: [],
          balance: 0,
          pagination: { hasNext: false, totalPages: 0 }
        });
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

    // 🔥 YOUR BRILLIANT SELF-HEALING PATCH (Kept exactly as you wrote it)
    if ((!transactions || transactions.length === 0) && walletData.balance > 0) {
        const seedTx = {
            user_id: userId,
            reference: `seed_${Date.now()}`,
            transaction_type: 'INFLOW',
            amount: walletData.balance,
            status: 'SUCCESS',
            source: 'PAYSTACK'
        };

        const { error: seedError } = await supabaseAdmin.from('wallet_transactions').insert([seedTx]);
        
        if (seedError) {
           console.error("🚨 SUPABASE SEED ERROR:", seedError); 
        }
        
        const refetched = await supabaseAdmin
            .from('wallet_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        transactions = refetched.data || [];
        count = refetched.count || 1;
    }

    const totalItems = count || transactions?.length || 0;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;

    return NextResponse.json({ 
      success: true, 
      transactions: transactions || [], // Matches your frontend exactly!
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