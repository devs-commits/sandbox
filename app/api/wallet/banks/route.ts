import { NextResponse } from "next/server";

// 🔥 CRITICAL FIX 1: Forces Next.js to run this live every time, preventing permanent build-time caching
export const dynamic = "force-dynamic";

const PAYSTACK_SAFE_FALLBACK = [
  { institutionCode: "044", institutionName: "Access Bank" },
  { institutionCode: "050", institutionName: "Ecobank Nigeria" },
  { institutionCode: "070", institutionName: "Fidelity Bank" },
  { institutionCode: "011", institutionName: "First Bank of Nigeria" },
  { institutionCode: "214", institutionName: "First City Monument Bank" },
  { institutionCode: "058", institutionName: "Guaranty Trust Bank" },
  { institutionCode: "030", institutionName: "Heritage Bank" },
  { institutionCode: "082", institutionName: "Keystone Bank" },
  { institutionCode: "090405", institutionName: "Moniepoint MFB" },
  { institutionCode: "100004", institutionName: "OPay Digital Services Limited (OPay)" },
  { institutionCode: "100033", institutionName: "PalmPay" },
  { institutionCode: "076", institutionName: "Polaris Bank" },
  { institutionCode: "221", institutionName: "Stanbic IBTC Bank" },
  { institutionCode: "232", institutionName: "Sterling Bank" },
  { institutionCode: "032", institutionName: "Union Bank of Nigeria" },
  { institutionCode: "033", institutionName: "United Bank for Africa" },
  { institutionCode: "035", institutionName: "Wema Bank" },
  { institutionCode: "057", institutionName: "Zenith Bank" },
  { institutionCode: "090267", institutionName: "Kuda Bank" },
  { institutionCode: "090551", institutionName: "Fairmoney Microfinance Bank" }
];

export async function GET(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); 

  try {
    const response = await fetch("https://api.paystack.co/bank?country=nigeria&currency=NGN", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      cache: "no-store" // 🔥 CRITICAL FIX 2: Bypasses Next.js aggressive fetch caching
    });

    clearTimeout(timeoutId); // Clear timeout on successful network response

    const textResponse = await response.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error("❌ Paystack Banks API Parse Error:", textResponse);
      throw new Error("Invalid response from provider"); 
    }

    if (response.ok && data.status) {
      const mappedBanks = data.data.map((bank: any) => ({
        institutionCode: bank.code,
        institutionName: bank.name,
      }));

      const sortedBanks = mappedBanks.sort((a: any, b: any) => 
        a.institutionName.localeCompare(b.institutionName)
      );
      
      return NextResponse.json({ success: true, banks: sortedBanks });
    }

    throw new Error(data?.message || "Failed to fetch live banks from Paystack"); 

  } catch (error: any) {
    // 🔥 CRITICAL FIX 3: Prevent memory leaks if the network fails or times out!
    clearTimeout(timeoutId); 
    
    console.warn("⚠️ Live Paystack Bank API delayed/failed. Serving local fallback. Reason:", error.message);
    
    const sortedLocalBanks = PAYSTACK_SAFE_FALLBACK.sort((a: any, b: any) => 
      a.institutionName.localeCompare(b.institutionName)
    );

    return NextResponse.json({ 
        success: true, 
        banks: sortedLocalBanks,
        fallbackUsed: true 
    });
  }
}