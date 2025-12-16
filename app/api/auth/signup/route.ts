import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, country, track } = body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          role,
          country,
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
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          // We let the database generate its own primary 'id' (e.g. 1, 2, 3 or uuid)
          // We store the Auth ID in a separate column (Foreign Key)
          auth_id: data.user.id, 
          
          email: email,
          full_name: fullName,
          role: role,
          wallet_balance: 0, // Default balance
          track: track,
        });

      if (dbError) {
        console.error("Error creating public profile:", dbError);
        // Optional: You might want to delete the auth user here if profile creation fails
        await supabase.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ success: false, error: "Account created but profile failed. Please contact support." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
