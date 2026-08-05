import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin as importedAdmin } from '@/lib/supabase-admin';

// ADD SIGNUP USER TO MAILERLITE (Non-blocking)
const addToMailerLite = async (
  email: string, 
  fullName: string, 
  phone: string | undefined, 
  role: string, 
  country: string | undefined, 
  track: string | undefined, 
  experienceLevel: string | undefined, 
  subscriptionPlan: string
) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('MailerLite: Missing Supabase config', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
      return;
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/add-signup-to-mailerlite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        fullName,
        phone,
        role,
        country,
        track,
        experienceLevel,
        subscriptionPlan,
      }),
    });
    const data = await response.json();
    console.log('MailerLite sync response:', { status: response.status, data });
  } catch (error) {
    // Silently log - don't break signup if MailerLite fails
    console.error('MailerLite sync error:', error);
  }
};

// DEFENSIVE ADMIN CLIENT
const getAdminClient = () => {
  if (importedAdmin && typeof importedAdmin.from === 'function') {
    return importedAdmin;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, password, fullName, phone, role, country, // 🔥 ADDED: phone
      experienceLevel, track, referralLink, squadSlug,
      subscriptionPlan 
    } = body;

    const dbClient = getAdminClient();

    if (role === 'admin') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // ==========================================
    // DATE & SUBSCRIPTION CALCULATION ENGINE
    // ==========================================
    const startDate = new Date();
    const expiryDate = new Date();

    if (subscriptionPlan === 'trial') {
      expiryDate.setDate(startDate.getDate() + 14); // 14 Days
    } else if (subscriptionPlan === 'trial_7') {
      expiryDate.setDate(startDate.getDate() + 7);  // 7 Days
    } else if (subscriptionPlan === 'quarterly') {
      expiryDate.setMonth(startDate.getMonth() + 3); // 3 Months
    } else {
      expiryDate.setMonth(startDate.getMonth() + 1); // 1 Month
    }

    // ==========================================
    // SQUAD & REFERRAL HELPER FUNCTION
    // ==========================================
    const processSquadAndReferral = async (userId: string) => {
      // STRICT RULE: Trial accounts cannot trigger referrals or join squads
      if (subscriptionPlan?.startsWith('trial')) return;

      // 1. Handle Squad Assignment
      if (squadSlug) {
        const { data: squad } = await dbClient
          .from('squads')
          .select('id')
          .eq('slug', squadSlug.trim())
          .single();

        if (squad) {
          await dbClient.from('squad_members').insert([{
            squad_id: squad.id,
            user_id: userId,
            status: 'active'
          }]);
        }
      }

      // 2. Handle Financial Referral Reward
      if (referralLink) {
        const { data: referrer } = await dbClient
          .from('users')
          .select('id, wallet_balance')
          .eq('referral_code', referralLink.trim())
          .single();

        if (referrer && referrer.id !== userId) {
          const { error: refError } = await dbClient.from('referrals').insert([{ 
            referrer_id: referrer.id, 
            referee_id: userId, 
            status: 'completed', 
            reward_amount: 2000 
          }]);

          if (!refError) {
            await dbClient.from('users')
              .update({ wallet_balance: (referrer.wallet_balance || 0) + 2000 })
              .eq('id', referrer.id);
          }
        }
      }
    };

    // ==========================================
    // SCENARIO 1: RETURNING LEAD (Abandoned Cart)
    // ==========================================
    if (role === 'student') {
      const { data: existingLead } = await dbClient
        .from('users')
        .select('auth_id, has_completed_onboarding') 
        .eq('email', email)
        .maybeSingle();

      if (existingLead) {
        if (existingLead.has_completed_onboarding) { 
          return NextResponse.json({ success: false, error: "Account active. Please login." }, { status: 409 });
        } else {
          await dbClient.from('users').update({
            full_name: fullName,
            phone: phone,                      // 🔥 ADDED: Save phone number for returning lead
            country: country,
            track: track,
            experience_level: experienceLevel, 
            subscription_plan: subscriptionPlan || 'monthly',
            subscription_status: 'active',
            start_date: startDate.toISOString(),
            subscription_expires_at: expiryDate.toISOString(),
            nudge_sent: false                  
          }).eq('auth_id', existingLead.auth_id);

          await processSquadAndReferral(existingLead.auth_id);

          addToMailerLite(email, fullName, phone, role, country, track, experienceLevel, subscriptionPlan || 'monthly');

          return NextResponse.json({ 
            success: true, 
            user: { id: existingLead.auth_id, email }
          });
        }
      }
    }

    // ==========================================
    // SCENARIO 2: BRAND NEW REGISTRATION
    // ==========================================
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName, phone, role, country }, // 🔥 ADDED: Save phone in auth metadata
      },
    });

    if (authError) return NextResponse.json({ success: false, error: authError.message }, { status: 400 });

    const newAuthId = authData?.user?.id;

    if (!newAuthId) {
      console.error("Auth Error: No user ID returned from Supabase Auth");
      return NextResponse.json({ success: false, error: "User registration failed" }, { status: 500 });
    }

    // --- CREATE THE PENDING LEAD PROFILE ---
    if (authData.user) {
      const referralCode = `${fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6)}`;

      const { error: dbError } = await dbClient
        .from('users')
        .insert([{
          auth_id: newAuthId, 
          email: email,
          full_name: fullName, 
          phone: phone,                       // 🔥 ADDED: Save phone in database
          role: role,
          country: country,
          experience_level: experienceLevel, 
          track: track,
          subscription_plan: subscriptionPlan || 'monthly',
          referral_code: referralCode,       
          has_completed_onboarding: false,    
          has_completed_headquarters_tour: false,
          subscription_status: 'active',
          start_date: startDate.toISOString(),
          subscription_expires_at: expiryDate.toISOString(),    
          nudge_sent: false,                 
          wallet_balance: 0,                 
          is_first_task: true,               
          has_completed_tour: false          
        }]);

      if (dbError) {
        console.error("DB Profile Error:", dbError.message);
        await dbClient.auth.admin.deleteUser(newAuthId);
        
        if (dbError.message.includes("foreign key constraint")) {
           return NextResponse.json({ 
             success: false, 
             error: "Security Mismatch: Please delete your old account from the dashboard before signing up again." 
           }, { status: 500 });
        }

        return NextResponse.json({ success: false, error: "Profile creation failed" }, { status: 500 });
      }

      await processSquadAndReferral(newAuthId);
    }

    addToMailerLite(email, fullName, phone, role, country, track, experienceLevel, subscriptionPlan || 'monthly');

    return NextResponse.json({ success: true, user: authData.user, session: authData.session });

  } catch (error: any) {
    console.error("Signup Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}