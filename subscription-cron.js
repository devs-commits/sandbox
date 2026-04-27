const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { 
    sendRenewalReminderEmail, 
    sendAccessPausedEmail,
    sendAbandonedCartEmail // 🔥 Exported from your updated zeptomail file
} = require('./zeptomail'); 

// Initialize Supabase Client with Service Key for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

console.log("🚀 WDC Labs Subscription Engine Started...");

// ====================================================
// 🛒 TASK 1: ABANDONED CART NUDGE (LEADS)
// Runs every hour to check for incomplete signups
// ====================================================
cron.schedule('0 * * * *', async () => {
    console.log("🔍 Checking for abandoned registration leads...");
    
    // Threshold: Users created > 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    try {
        // Query users who:
        // 1. Haven't on-boarded (has_completed_onboarding = false)
        // 2. Haven't received a nudge yet (nudge_sent = false)
        // 3. Were created at least 2 hours ago
        const { data: leads, error } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('has_completed_onboarding', false)
            .eq('nudge_sent', false)
            .lt('created_at', twoHoursAgo);

        if (error) throw error;

        if (leads && leads.length > 0) {
            for (const lead of leads) {
                console.log(`📧 Sending Abandoned Cart Nudge to ${lead.email}`);
                
                // 1. Trigger the ZeptoMail nudge
                await sendAbandonedCartEmail(lead.email, lead.full_name);
                
                // 2. Mark as "Nudged" in DB so they aren't picked up next hour
                await supabase
                    .from('users')
                    .update({ nudge_sent: true })
                    .eq('id', lead.id);
            }
            console.log(`✅ Processed ${leads.length} leads.`);
        } else {
            console.log("ℹ️ No new abandoned leads to nudge.");
        }
    } catch (err) {
        console.error("❌ Abandoned Cart Error:", err.message);
    }
});

// ====================================================
// ⏰ TASK 2: RENEWAL ENGINE (DAILY EVALUATIONS)
// Runs every day at Midnight (00:00) WAT
// ====================================================
cron.schedule('0 0 * * *', async () => {
    console.log("⏰ Running daily subscription evaluations...");
    
    const today = new Date();
    
    try {
        // 1. Fetch active users
        const { data: users, error } = await supabase
            .from('users')
            .select('*, wallets(balance)')
            .eq('subscription_status', 'active');
            
        if (error) throw error;

        for (const user of users) {
            const expiryDate = new Date(user.subscription_expires_at);
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            // ==========================================
            // 📢 RENEWAL NOTIFICATIONS (Day 21, 24, 26, 27)
            // ==========================================
            if ([7, 4, 2, 1].includes(daysLeft)) {
                console.log(`📧 Sending ${daysLeft}-day reminder to ${user.email}`);
                await sendRenewalReminderEmail(user.email, user.full_name, daysLeft);
            }
            
            // ==========================================
            // 💳 EXPIRY & AUTO-RENEW LOGIC (DAY 30)
            // ==========================================
            if (daysLeft <= 0) {
                console.log(`🔍 Evaluating Day 30 Expiry for ${user.email}`);
                
                const walletBalance = user.wallets?.balance || 0;
                const renewalFee = 15000;

                if (walletBalance >= renewalFee) {
                    // --- SUCCESS: AUTO-RENEW ---
                    console.log(`✅ Renewing subscription for ${user.email}`);
                    
                    const newExpiry = new Date();
                    newExpiry.setDate(today.getDate() + 30);

                    // 1. Deduct from Wallet
                    await supabase.from('wallets')
                        .update({ balance: walletBalance - renewalFee })
                        .eq('user_id', user.auth_id);

                    // 2. Update User Subscription Dates
                    await supabase.from('users').update({
                        subscription_expires_at: newExpiry.toISOString(),
                        last_payment_date: today.toISOString(),
                        renewal_status: 'renewed'
                    }).eq('auth_id', user.auth_id);

                    // 3. Log the transaction
                    await supabase.from('wallet_transactions').insert({
                        user_id: user.auth_id,
                        amount: renewalFee,
                        transaction_type: 'OUTFLOW',
                        status: 'SUCCESS',
                        description: 'Monthly Subscription Renewal',
                        provider_tx_id: `RENEW-${Date.now()}`
                    });

                } else {
                    // --- FAILURE: LOCK ACCOUNT ---
                    console.log(`🚫 Insufficient funds for ${user.email}. Pausing access.`);
                    
                    await supabase.from('users').update({ 
                        subscription_status: 'expired',
                        renewal_status: 'churned'
                    }).eq('auth_id', user.auth_id);

                    // Send the "Access Paused" email via ZeptoMail
                    await sendAccessPausedEmail(user.email, user.full_name);
                }
            }
        }
    } catch (err) {
        console.error("❌ Cron Job Error:", err.message);
    }
}, {
    scheduled: true,
    timezone: "Africa/Lagos"
});