import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin as importedAdmin } from '@/lib/supabase-admin';

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
      email, password, fullName, role, country, 
      experienceLevel, track, referralLink, subscriptionPlan 
    } = body;

    const dbClient = getAdminClient();

    if (role === 'admin') {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

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
            country: country,
            track: track,
            experience_level: experienceLevel, 
            subscription_plan: subscriptionPlan || 'monthly',
            nudge_sent: false                  
          }).eq('auth_id', existingLead.auth_id);

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
        data: { fullName, role, country },
      },
    });

    if (authError) return NextResponse.json({ success: false, error: authError.message }, { status: 400 });

    // --- CAPTURE THE ID DEFENSIVELY ---
    // Fix: Redundant .data access removed to align with Supabase types
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
          role: role,
          country: country,
          experience_level: experienceLevel, 
          track: track,
          subscription_plan: subscriptionPlan || 'monthly',
          referral_code: referralCode,       
          has_completed_onboarding: false,    
          subscription_status: 'pending',     
          nudge_sent: false,                 
          wallet_balance: 0,                 
          is_first_task: true,               
          has_completed_tour: false          
        }]);

      if (dbError) {
        console.error("DB Profile Error:", dbError.message);
        // Clean up the auth user if the profile creation fails
        await dbClient.auth.admin.deleteUser(newAuthId);
        
        if (dbError.message.includes("foreign key constraint")) {
           return NextResponse.json({ 
             success: false, 
             error: "Security Mismatch: Please delete your old account from the dashboard before signing up again." 
           }, { status: 500 });
        }

        return NextResponse.json({ success: false, error: "Profile creation failed" }, { status: 500 });
      }

      // Handle Referral Reward
      if (referralLink) {
        const { data: referrer } = await dbClient
          .from('users')
          .select('id, wallet_balance')
          .eq('referral_code', referralLink.trim())
          .single();

        if (referrer) {
          await dbClient.from('users').update({ wallet_balance: (referrer.wallet_balance || 0) + 2000 }).eq('id', referrer.id);
          await dbClient.from('referrals').insert([{ referrer_id: referrer.id, referee_id: newAuthId, status: 'completed', reward_amount: 2000 }]);
        }
      }
    }

    return NextResponse.json({ success: true, user: authData.user, session: authData.session });

  } catch (error: any) {
    console.error("Signup Crash:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}