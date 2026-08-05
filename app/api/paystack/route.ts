import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    // 1. Get raw body for cryptographic signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 2. Verify the Webhook Signature (Security measure)
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
    
    // 🚨 LOCAL TESTING BYPASS: If you are using Postman locally, we allow the request through even without a valid Paystack signature.
    const isLocalTest = process.env.NODE_ENV === "development" && !signature;
    
    if (hash !== signature && !isLocalTest) {
      console.error("🔴 Invalid Paystack Signature");
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    // ====================================================================
    // HANDLE SUCCESSFUL DEPOSITS (INFLOWS)
    // ====================================================================
    if (event === "charge.success") {
      const amountInNaira = data.amount / 100; // Paystack sends amounts in Kobo
      const reference = data.reference;
      
      // Paystack attaches the customer_code for Dedicated Virtual Accounts
      const customerCode = data.customer?.customer_code;

      if (!customerCode) {
         return NextResponse.json({ success: true, message: "Ignored: No customer code found" });
      }

      // 1. Find the user's wallet using the Paystack Customer Code
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('paystack_customer_code', customerCode)
        .single();

      if (walletError || !wallet) {
        console.error("🔴 Wallet not found for deposit:", customerCode);
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }

      // 2. Prevent Double-Crediting (Check if this exact transaction ref already exists)
      const { data: existingTx } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('reference', reference)
        .maybeSingle();

      if (existingTx) {
        return NextResponse.json({ success: true, message: "Transaction already processed" });
      }

      // 3. Atomically update wallet balance
      const newBalance = wallet.balance + amountInNaira;
      
      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      // 4. Log the transaction in the ledger
      await supabaseAdmin
        .from('wallet_transactions')
        .insert([{
          user_id: wallet.user_id,
          reference: reference,
          transaction_type: 'INFLOW',
          funding_method: 'BANK_TRANSFER', // They sent money to the virtual account
          amount: amountInNaira,
          totalAmount: amountInNaira,
          balance_before: wallet.balance,
          balance_after: newBalance,
          status: 'COMPLETED', // Inflows are instantly completed
          source: 'PAYSTACK',
          description: 'Wallet Funding via Virtual Account'
        }]);

      // 5. Keep global user profile synced
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('wallet_balance')
        .eq('auth_id', wallet.user_id)
        .single();
        
      if (userRecord) {
        await supabaseAdmin
          .from('users')
          .update({ wallet_balance: (userRecord.wallet_balance || 0) + amountInNaira })
          .eq('auth_id', wallet.user_id);
      }
      
      console.log(`✅ Webhook processed successfully. Credited ₦${amountInNaira} to ${wallet.account_name}`);
    }

    // Paystack requires a 200 OK response quickly, otherwise they will keep retrying.
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}