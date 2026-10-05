import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    let requiresFirstShift = false;
    if (userRole === 'student') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('has_completed_onboarding, has_completed_tour, has_completed_headquarters_tour')
        .eq('auth_id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Unable to load onboarding state after login:', profileError);
      } else if (profile && !profile.has_completed_onboarding && !profile.has_completed_tour && !profile.has_completed_headquarters_tour) {
        const [{ data: flag, error: flagError }, { count, error: taskError }] = await Promise.all([
          supabaseAdmin
            .from('feature_flags')
            .select('mode')
            .eq('key', 'first_shift_enabled')
            .maybeSingle(),
          supabaseAdmin
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user', data.user.id),
        ]);

        if (flagError || taskError) {
          console.error('Unable to confirm First Shift eligibility after login:', flagError || taskError);
        } else {
          requiresFirstShift = flag?.mode === 'everyone' && count === 0;
        }
      }
    }

    return NextResponse.json({ success: true, user: data.user, session: data.session, requiresFirstShift });

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}