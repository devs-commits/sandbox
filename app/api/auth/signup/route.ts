import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, country, experienceLevel, track, referralLink } = body;

    // Server-side validation
    if (role === 'admin') {
      return NextResponse.json({ success: false, error: "Admin accounts cannot be created via signup" }, { status: 403 });
    }

    if (role === 'student' && (!track || !experienceLevel)) {
      return NextResponse.json({ success: false, error: "Track and experience level are required for students" }, { status: 400 });
    }

    const dbClient = supabaseAdmin || supabase;

    // ==========================================
    // 🛑 ABANDONED CART / RETRY LOGIC
    // ==========================================
    
    // 1. Check if it's a returning Student who hasn't paid
    if (role === 'student') {
      const { data: existingStudent } = await dbClient
        .from('users')
        .select('auth_id, email, has_completed_onboarding')
        .eq('email', email)
        .maybeSingle();

      if (existingStudent) {
        if (existingStudent.has_completed_onboarding) {
          return NextResponse.json({ success: false, error: "Account already exists and is active. Please login." }, { status: 409 });
        } else {
          // 🔥 Abandoned Cart! Update their info in case they changed their track/details
          await dbClient.from('users').update({
            full_name: fullName,
            country: country,
            track: track,
            experience_level: experienceLevel
          }).eq('auth_id', existingStudent.auth_id);

          // Return success so the frontend immediately triggers the Paystack Popup
          return NextResponse.json({ 
            success: true, 
            user: { id: existingStudent.auth_id, email: existingStudent.email }, 
            session: null 
          });
        }
      }
    }

    // 2. Check if it's a returning Recruiter
    if (role === 'recruiter') {
      const { data: existingRecruiter } = await dbClient
        .from('recruiters')
        .select('auth_id, email') // Assuming recruiters don't use has_completed_onboarding, or add it if they do
        .eq('email', email)
        .maybeSingle();

      if (existingRecruiter) {
        // Update their details and send them to payment
        await dbClient.from('recruiters').update({
          full_name: fullName,
          country: country
        }).eq('auth_id', existingRecruiter.auth_id);

        return NextResponse.json({ 
          success: true, 
          user: { id: existingRecruiter.auth_id, email: existingRecruiter.email }, 
          session: null 
        });
      }
    }

    // ==========================================
    // 🟢 BRAND NEW USER CREATION LOGIC
    // ==========================================

    // Get the base URL dynamically based on the request headers (helpful for Vercel/AWS environments)
    // Fallback to your production URL if headers aren't available
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "labs.wdc.ng";
    const originUrl = `${protocol}://${host}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 🔥 THE FIX: Tell Supabase exactly where to send them after email verification
        emailRedirectTo: `${originUrl}/auth/login`, // Change '/auth/login' to whatever your actual login route is!
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

    // Check if user already exists in Auth but somehow bypassed our public table check
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    // --- LINKING STEP ---
    if (data.user) {
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
            wallet_balance: 0, 
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
        if (!studentError && studentData && referralLink) {
          const refCode = referralLink.trim();
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
          }
        }
      }

      if (dbError) {
        console.error("Error creating public profile:", dbError);
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        }
        return NextResponse.json({ success: false, error: "Account created but profile failed. Please contact support." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    console.error("Signup Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}