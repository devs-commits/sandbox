// lib/commissionEngine.ts
import { sendReferralSuccessEmail } from "./zeptomail";
import { createClient } from '@supabase/supabase-js';

// 🔥 We MUST use the Service Role Key here to securely bypass RLS for financial updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processReferralCommission(newUserId: number, amountPaid: number) {
  try {
    // 1. Check if the paying user was referred and is still pending
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referred_user_id', newUserId)
      .eq('status', 'pending')
      .single();

    // If no pending referral exists, just exit silently (organic signup)
    if (!referral) return { success: true, message: "No pending referral." };

    // 2. Calculate the 10% Commission
    const commission = amountPaid * 0.10;

    // 3. Mark the Referral as Active
    await supabaseAdmin
      .from('referrals')
      .update({ status: 'active' })
      .eq('id', referral.id);

    // 4. Fetch the Referrer's current Wallet and Earnings
    const { data: referrerWallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', referral.referrer_id)
      .single();

    const { data: referrerData } = await supabaseAdmin
      .from('users')
      .select('earnings')
      .eq('id', referral.referrer_id)
      .single();

    // 5. Credit the Wallet Balance
    const newBalance = (referrerWallet?.balance || 0) + commission;
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', referral.referrer_id);

    // 6. Update Total Earnings Tracking
    const newEarnings = (referrerData?.earnings || 0) + commission;
    await supabaseAdmin
      .from('users')
      .update({ earnings: newEarnings })
      .eq('id', referral.referrer_id);

    // 7. Write to Transaction History (For their Wallet UI)
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: referral.referrer_id,
        amount: commission,
        type: 'credit',
        description: 'Referral Commission',
        status: 'completed'
      });

      // Fetch the referrer's email to send the alert
    const { data: referrerDataForEmail } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', referral.referrer_id)
      .single();

    if (referrerDataForEmail?.email) {
       await sendReferralSuccessEmail(referrerDataForEmail.email, referrerDataForEmail.full_name, "your referral", commission);
    }

    console.log(`WDC Labs: ₦${commission} successfully credited to Referrer DB ID: ${referral.referrer_id}`);
    return { success: true };

  } catch (error) {
    console.error("WDC Labs Commission Engine Error:", error);
    return { success: false, error };
  }
}