import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, country, experienceLevel, track } = body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          role,
          country,
          experienceLevel,
          track,
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

      const { data: userData, error: dbError } = await dbClient
        .from('users')
        .insert({
          // We let the database generate its own primary 'id' (e.g. 1, 2, 3 or uuid)
          // We store the Auth ID in a separate column (Foreign Key)
          auth_id: data.user.id, 
          
          email: email,
          full_name: fullName,
          role: role,
          country: country,
          experience_level: experienceLevel,
          wallet_balance: 0, // Default balance
          track: track,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error creating public profile:", dbError);
        // Optional: You might want to delete the auth user here if profile creation fails
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        }
        return NextResponse.json({ success: false, error: "Account created but profile failed. Please contact support." }, { status: 500 });
      }

      // Generate tasks for students based on their track
      if (role === 'student' && track && userData) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tasks/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id, // Use Auth UUID, not public table ID
              track: track,
              experienceLevel: experienceLevel,
            }),
          });

          const taskResult = await response.json();
          
          if (!taskResult.success) {
            console.error('Failed to generate tasks:', taskResult.error);
            // Don't fail the signup if task generation fails, just log it
          }
        } catch (taskError) {
          console.error('Error calling task generation endpoint:', taskError);
          // Don't fail the signup if task generation fails, just log it
        }
      }
    }

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
