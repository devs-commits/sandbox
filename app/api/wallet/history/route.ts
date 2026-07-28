import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Standard fetch for both balance check and the new POST transactions check
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error("Provider timeout");
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, page = 1, limit = 15 } = await req.json();
    let { accountNumber } = await req.json().catch(() => ({}));

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 🔥 SMART LOOKUP: If frontend didn't pass accountNumber, grab it securely from DB
    if (!accountNumber) {
        const { data: walletObj } = await supabaseAdmin
            .from('wallets')
            .select('account_number')
            .eq('user_id', userId)
            .single();
        
        if (walletObj?.account_number && walletObj.account_number !== "****") {
            accountNumber = walletObj.account_number;
        } else {
            return NextResponse.json({ error: "No active settlement account found." }, { status: 400 });
        }
    }

    const apiKey = process.env.PAYMENT_API_KEY!;
    const merchantId = process.env.PAYMENT_MERCHANT_ID!;
    const baseUrl = process.env.PAYMENT_BASE_URL;

    let liveBalance = undefined;
    let providerTransactions = [];
    let paginationData = { hasNext: false, totalPages: 1 };

    try {
      // 1. FETCH LIVE BALANCE
      if (page === 1) {
          const balanceRes = await fetchWithTimeout(`${baseUrl}/virtual-wallet?accountNumber=${accountNumber}`, {
            method: "GET",
            headers: { "x-api-key": apiKey, "merchant-id": merchantId },
          }, 8000);

          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            if (balanceData?.data?.result?.[0]?.availableBalance !== undefined) {
              liveBalance = Number(balanceData.data.result[0].availableBalance);
              
              // Sync the mirrored balance to both tables so your team can read it!
              await supabaseAdmin.from('wallets').update({ balance: liveBalance }).eq('user_id', userId);
              await supabaseAdmin.from('users').update({ wallet_balance: liveBalance }).eq('auth_id', userId);
            }
          }
      }

      // 2. FETCH LIVE TRANSACTIONS (Now using standard POST!)
      console.log(`\n🔵 [API] Fetching Transactions via POST to: ${baseUrl}/transactions`);
      
      const txRes = await fetchWithTimeout(
          `${baseUrl}/transactions`, 
          {
              method: 'POST',
              headers: { 
                  "x-api-key": apiKey, 
                  "merchant-id": merchantId,
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ accountNumber: String(accountNumber), page, limit })
          }
      );

      if (txRes.ok) {
          const txData = await txRes.json();
          if (txData?.success && txData?.data?.result) {
              console.log(`🟢 [API] Success! Found ${txData.data.result.length} transactions.`);
              providerTransactions = txData.data.result;
              const pagedInfo = txData.data.pagedInfo || {};
              paginationData = { hasNext: pagedInfo.hasNext || false, totalPages: pagedInfo.totalPages || 1 };
          } else {
              console.error(`🔴 [API] Provider Failure (Success flag missing):`, txData);
          }
      } else {
          const errorText = await txRes.text();
          console.error(`🔴 [API] Provider Failure (${txRes.status}):`, errorText);
      }

    } catch (providerError: any) {
       console.error("🔴 [API] Provider Sync Error:", providerError.message);
    }

    // 3. FALLBACK TO TEAM MIRROR
    if (providerTransactions.length === 0 && page === 1) {
        console.log("🟠 [API] Activating Local Database Fallback...");
        const { data: localTx } = await supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        return NextResponse.json({ 
            success: true, 
            transactions: localTx || [], 
            balance: liveBalance,
            pagination: { hasNext: false, totalPages: 1 },
            isLocalFallback: true
        });
    }

    return NextResponse.json({ 
      success: true, 
      transactions: providerTransactions,
      balance: liveBalance,
      pagination: paginationData,
      isLocalFallback: false
    });

  } catch (error: any) {
    console.error("Fatal Ledger Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}