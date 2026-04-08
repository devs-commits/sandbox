import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // Attempt to log the user in via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Supabase handles the "Invalid credentials" or "Email not confirmed" messages automatically
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    // Login successful! Return the user data and session to the frontend
    return NextResponse.json({ 
      success: true, 
      user: data.user, 
      session: data.session 
    });

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}