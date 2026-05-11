import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import https from "https"; // Raw Node.js module

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Standard fetch for the balance check
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

// 🔥 THE FIX: A raw HTTP client that forces a GET request to accept a JSON body
function forceGetWithBody(urlStr: string, headers: any, bodyData: any, timeoutMs = 15000): Promise<any> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const payload = JSON.stringify(bodyData);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET', // Forcing GET
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: timeoutMs
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, text: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => { req.destroy(); reject(new Error('Provider timeout')); });
        
        // Write the body to the GET request!
        req.write(payload);
        req.end();
    });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber, page = 1, limit = 15 } = await req.json();

    if (!userId || !accountNumber) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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
              await supabaseAdmin.from('wallets').update({ balance: liveBalance }).eq('user_id', userId);
            }
          }
      }

      // 2. FETCH LIVE TRANSACTIONS (Using the Force Method)
      console.log(`\n🔵 [API] Forcing GET with Body to: ${baseUrl}/transactions`);
      
      const txRes = await forceGetWithBody(
          `${baseUrl}/transactions`, 
          { "x-api-key": apiKey, "merchant-id": merchantId },
          { accountNumber: String(accountNumber), page, limit } // Sending the exact body Postman used
      );

      if (txRes.status === 200 && txRes.data?.success && txRes.data?.data?.result) {
          console.log(`🟢 [API] Success! Found ${txRes.data.data.result.length} transactions.`);
          providerTransactions = txRes.data.data.result;
          const pagedInfo = txRes.data.data.pagedInfo || {};
          paginationData = { hasNext: pagedInfo.hasNext || false, totalPages: pagedInfo.totalPages || 1 };
      } else {
          console.error(`🔴 [API] Provider Failure (${txRes.status}):`, txRes.data || txRes.text);
      }

    } catch (providerError: any) {
       console.error("🔴 [API] Provider Sync Error:", providerError.message);
    }

    // 3. FALLBACK
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}