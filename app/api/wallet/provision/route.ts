import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { userId, bvn, firstName, lastName, phone, email, personalAccountNumber, bankCode, isRefresh } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and Email are required." }, { status: 400 });
    }

    if (!isRefresh && (!bvn || !firstName || !lastName || !phone || !personalAccountNumber || !bankCode)) {
      return NextResponse.json({ 
        error: "Missing required identity fields. Bank Account and BVN are mandatory." 
      }, { status: 400 });
    }

    // ====================================================================
    // STEP 1: Create or Fetch the Customer on Paystack
    // ====================================================================
    let customerCode = "";
    
    if (isRefresh) {
      const getCustRes = await fetch(`https://api.paystack.co/customer/${email}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
      const getCustData = await getCustRes.json();
      customerCode = getCustData.data?.customer_code;
    } else {
      const customerRes = await fetch("https://api.paystack.co/customer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, phone }),
      });

      const customerData = await customerRes.json();
      customerCode = customerData.data?.customer_code;
      
      if (!customerRes.ok && customerData.code === 'duplicate_email') {
        const getCustRes = await fetch(`https://api.paystack.co/customer/${email}`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });
        const getCustData = await getCustRes.json();
        customerCode = getCustData.data?.customer_code;
      } else if (!customerRes.ok) {
        throw new Error(customerData.message || "Failed to create Paystack customer");
      }
    }

    if (!customerCode) throw new Error("Could not retrieve customer code from Paystack");

    // ====================================================================
    // STEP 1.5: FORCE UPDATE CUSTOMER PROFILE
    // If the customer was created via Card Checkout, they lack a phone number.
    // Paystack KYC will crash with "Missing required information" without this!
    // ====================================================================
    if (!isRefresh) {
      await fetch(`https://api.paystack.co/customer/${customerCode}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone
        }),
      });
    }

    // ====================================================================
    // STEP 2: Initiate Identity Validation
    // ====================================================================
    if (!isRefresh) {
      const validationPayload = {
        country: "NG",
        type: "bank_account",
        account_number: personalAccountNumber,
        bvn: bvn,
        bank_code: bankCode,
        first_name: firstName,
        last_name: lastName,
      };

      const validationRes = await fetch(`https://api.paystack.co/customer/${customerCode}/identification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationPayload),
      });

      const validationData = await validationRes.json();
      
      // Strict logging so we know EXACTLY what Paystack complains about
      console.log("PAYSTACK KYC RESPONSE:", JSON.stringify(validationData));

      if (!validationRes.ok && !validationData.message?.toLowerCase().includes("already validated")) {
         throw new Error(validationData.message || "Failed to initiate identity validation");
      }
    }

    // ====================================================================
    // STEP 3: GENERATE THE VIRTUAL ACCOUNT
    // ====================================================================
    // 🔥 Check if we are in Test Mode. If so, let Paystack auto-assign the bank.
    // If we are Live, enforce Titan-Paystack for reliability.
    const isTestMode = PAYSTACK_SECRET_KEY?.startsWith('sk_test');
    
    const requestBody: any = {
      customer: customerCode,
    };

    if (!isTestMode) {
        requestBody.preferred_bank = "titan-paystack";
    }

    const dvaRes = await fetch("https://api.paystack.co/dedicated_account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    const dvaData = await dvaRes.json();
    console.log("PAYSTACK DVA RESPONSE:", JSON.stringify(dvaData));

    // 🔥 BULLETPROOF DB SAVE HELPER (Schema Fixed)
    const saveWalletToDB = async (accountNumber: string, bankName: string, accountName: string) => {
      // 1. Check if a wallet row already exists
      const { data: existing } = await supabaseAdmin.from('wallets').select('id').eq('user_id', userId).maybeSingle();
      
      // 2. Safely Update or Insert without triggering strict upsert conflicts
      if (existing) {
        const { error } = await supabaseAdmin.from('wallets').update({
          account_number: accountNumber,
          bank_name: bankName,
          account_name: accountName,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
        if (error) console.error("CRITICAL DB UPDATE ERROR:", error);
      } else {
        const { error } = await supabaseAdmin.from('wallets').insert({
          user_id: userId,
          account_number: accountNumber,
          bank_name: bankName,
          account_name: accountName
        });
        if (error) console.error("CRITICAL DB INSERT ERROR:", error);
      }

      // 3. Mark the user profile as verified
      await supabaseAdmin.from('users').update({
        kyc_status: 'verified',
        paystack_customer_code: customerCode
      }).eq('auth_id', userId);
    };

    // 1. Account Successfully Generated
    if (dvaRes.ok && dvaData.status) {
      await saveWalletToDB(dvaData.data.account_number, dvaData.data.bank.name, dvaData.data.account_name);
      return NextResponse.json({ success: true, message: "Wallet generated!", status: "verified" });
    } 
    
    // 2. Fallback: If they already have an active account on Paystack
    else if (!dvaRes.ok && dvaData.message?.toLowerCase().includes("active virtual account")) {
        const listDvaRes = await fetch(`https://api.paystack.co/dedicated_account?customer=${customerCode}`, {
           headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        });
        const listDvaData = await listDvaRes.json();

        if (listDvaData.data && listDvaData.data.length > 0) {
            const existingAccount = listDvaData.data[0];
            await saveWalletToDB(existingAccount.account_number, existingAccount.bank.name, existingAccount.account_name);
            return NextResponse.json({ success: true, message: "Wallet retrieved!", status: "verified" });
        }
    }

    // 3. KYC is still pending at NIBSS. Fallback to processing state.
    await supabaseAdmin.from('users').update({
      kyc_status: 'pending',
      paystack_customer_code: customerCode
    }).eq('auth_id', userId);

    return NextResponse.json({
      success: true,
      message: "Identity verification submitted. Your virtual wallet will be generated shortly.",
      status: "pending_verification"
    });

  } catch (error: any) {
    console.error("Wallet Provisioning Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 400 } 
    );
  }
}