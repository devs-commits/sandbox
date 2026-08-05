import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin to bypass RLS for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 🔥 FIX 1: Extracted bvn instead of nin, and ensured phone and email are grabbed
    const { userId, bvn, firstName, lastName, phone, email } = body;

    // 🔥 FIX 2: Strict check for bvn (nin is completely gone)
    if (!userId || !bvn || !firstName || !lastName || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ====================================================================
    // STEP 1: Create or Fetch the Customer on Paystack
    // ====================================================================
    const customerRes = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      }),
    });

    const customerData = await customerRes.json();
    let customerCode = customerData.data?.customer_code;
    
    // 🔥 SELF-HEALING: If customer already exists, fetch their code directly
    if (!customerRes.ok && customerData.code === 'duplicate_email') {
      const getCustRes = await fetch(`https://api.paystack.co/customer/${email}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
      const getCustData = await getCustRes.json();
      customerCode = getCustData.data?.customer_code;
    } else if (!customerRes.ok) {
      throw new Error(customerData.message || "Failed to create Paystack customer");
    }

    if (!customerCode) throw new Error("Could not retrieve customer code from Paystack");

    // ====================================================================
    // STEP 2: Initiate Identity Validation (LIVE READY)
    // ====================================================================
    const validationRes = await fetch(`https://api.paystack.co/customer/${customerCode}/identification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        country: "NG",
        type: "bvn",    // 🔥 FIX 3: Changed from 'bank_account' to 'bvn'
        value: bvn,     // 🔥 FIX 4: Dynamically pass the user's actual BVN instead of hardcoded sandbox numbers
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const validationData = await validationRes.json();
    
    // 🔥 SELF-HEALING: If they are already validated, ignore the error and keep moving!
    if (!validationRes.ok && !validationData.message?.toLowerCase().includes("already validated")) {
       throw new Error(validationData.message || "Failed to validate identity");
    }

    // ====================================================================
    // STEP 3: GENERATE (OR RECOVER) DEDICATED VIRTUAL ACCOUNT
    // ====================================================================
    let virtualAccount = null;

    const fetchDvaRes = await fetch(`https://api.paystack.co/dedicated_account?customer=${customerCode}`, {
       headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const fetchDvaData = await fetchDvaRes.json();

    if (fetchDvaData.status && fetchDvaData.data && fetchDvaData.data.length > 0) {
        // They already have an account! Just grab it.
        virtualAccount = fetchDvaData.data[0]; 
    } else {
        // They don't have one, generate a new one.
        const dvaRes = await fetch("https://api.paystack.co/dedicated_account", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerCode,
            // 🔥 Removed preferred_bank: "test-bank" to allow Paystack to assign a Live Wema/Titan account
          }),
        });

        const dvaData = await dvaRes.json();
        if (!dvaRes.ok || !dvaData.status) {
          throw new Error(dvaData.message || "Failed to generate virtual account");
        }
        virtualAccount = dvaData.data;
    }

    // ====================================================================
    // STEP 4: BULLETPROOF DATABASE SAVE (Schema Fixed)
    // ====================================================================
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const walletPayload = {
      account_number: virtualAccount.account_number,
      account_name: virtualAccount.account_name,
      bank_name: virtualAccount.bank.name,
      updated_at: new Date().toISOString()
    };

    let dbError;
    if (existingWallet) {
      const { error } = await supabaseAdmin.from('wallets').update(walletPayload).eq('id', existingWallet.id);
      dbError = error;
    } else {
      const { error } = await supabaseAdmin.from('wallets').insert([{ 
        ...walletPayload, 
        user_id: userId, 
        balance: 0 
      }]);
      dbError = error;
    }

    if (dbError) throw new Error(`Database failed to save account: ${dbError.message}`);

    // Mark user profile as complete
    await supabaseAdmin.from('users').update({ is_complete: true }).eq('auth_id', userId);

    return NextResponse.json({
      success: true,
      message: "Virtual account generated and securely saved.",
      accountNumber: virtualAccount.account_number
    });

  } catch (error: any) {
    console.error("Wallet Generation Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 400 } 
    );
  }
}