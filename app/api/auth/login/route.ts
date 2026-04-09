import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, error: "Email, password, and role are required" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    const userRole = data.user?.user_metadata?.role;
    if (userRole !== role) {
      await supabase.auth.signOut();
      return NextResponse.json({ 
        success: false, 
        error: `This email is registered as ${userRole}, not ${role}` 
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, user: data.user, session: data.session });

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}