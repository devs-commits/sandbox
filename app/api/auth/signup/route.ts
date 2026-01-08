import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, country, experienceLevel, track } = body;

    // Server-side validation
    if (role === 'admin') {
      return NextResponse.json({ success: false, error: "Admin accounts cannot be created via signup" }, { status: 403 });
    }

    if (role === 'student' && (!track || !experienceLevel)) {
      return NextResponse.json({ success: false, error: "Track and experience level are required for students" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          role,
          country,
          experienceLevel: role === 'student' ? experienceLevel : null,
          track: role === 'student' ? track : null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Check if user already exists (Supabase returns an empty identities array for existing users when email confirmation is enabled)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    // --- LINKING STEP ---
    // Now insert the profile data into your public table
    if (data.user) {
      // Use supabaseAdmin if available to bypass RLS, otherwise fall back to anon client
      const dbClient = supabaseAdmin || supabase;

      let dbError;
      let userData;

      // Generate a unique referral code for the NEW user
      const newReferralCode = `${fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6)}`;

      if (role === 'recruiter') {
        const { data: recruiterData, error: recruiterError } = await dbClient
          .from('recruiters')
          .insert({
            auth_id: data.user.id,
            email: email,
            full_name: fullName,
            country: country,
            role: role,
          })
          .select()
          .single();

        dbError = recruiterError;
        userData = recruiterData;
      } else {
        const { data: studentData, error: studentError } = await dbClient
          .from('users')
          .insert({
            auth_id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            country: country,
            experience_level: experienceLevel,
            wallet_balance: 0, // Default balance
            track: track,
            referral_code: newReferralCode,
            has_completed_onboarding: false,
            has_completed_tour: false,
            user_level: null,
            is_first_task: true,
          })
          .select()
          .single();

        dbError = studentError;
        userData = studentData;

        // Process Referral Reward (Student only)
        // If a referral link/code was provided, find the referrer and reward them
        if (!studentError && studentData && body.referralLink) {
          const refCode = body.referralLink.trim();
          // Find referrer
          const { data: referrer, error: refError } = await dbClient
            .from('users')
            .select('id, wallet_balance')
            .eq('referral_code', refCode)
            .single();

          if (referrer && !refError) {
            const reward = 2000;

            // 1. Update Referrer Wallet
            await dbClient
              .from('users')
              .update({ wallet_balance: (referrer.wallet_balance || 0) + reward })
              .eq('id', referrer.id);

            // 2. Create Referral Record
            await dbClient
              .from('referrals')
              .insert({
                referrer_id: referrer.id,
                referee_id: studentData.id,
                status: 'completed',
                reward_amount: reward
              });

            console.log(`Referral processed: ${referrer.id} referred ${studentData.id}. Reward: ${reward}`);
          }
        }
      }

      if (dbError) {
        console.error("Error creating public profile:", dbError);
        // Optional: You might want to delete the auth user here if profile creation fails
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        }
        return NextResponse.json({ success: false, error: "Account created but profile failed. Please contact support." }, { status: 500 });
      }


    }

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
