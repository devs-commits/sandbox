import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    console.log("Streak API called for userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use admin client to bypass RLS for reading/writing streak data reliably
    // Fallback to standard client if admin is not configured (though it should be for this to work securely)
    const db = supabaseAdmin || supabase;

    // 1. Get current user data
    // We query by auth_id because userId passed from client is likely the Auth UUID
    const { data: users, error: fetchError } = await db
      .from('users')
      .select('id, current_streak, last_activity_date')
      .eq('auth_id', userId)
      .limit(1);

    if (fetchError) {
      console.error("Error fetching user for streak:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const user = users?.[0];

    if (!user) {
      console.log("User not found in public table for auth_id:", userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActivity = user.last_activity_date;
    let newStreak = Number(user.current_streak) || 0;
    let status = 'active';

    console.log(`Processing streak for user ${user.id}. Last activity: ${lastActivity}, Today: ${today}, Current Streak: ${newStreak}`);

    // If already active today, just return current streak
    if (lastActivity === today) {
      console.log("Streak already active for today.");
      return NextResponse.json({ streak: newStreak, status: 'active' });
    }

    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActivity === yesterdayStr) {
      // Streak continues
      newStreak += 1;
      status = 'increased';
    } else if (!lastActivity) {
      // First time
      newStreak = 1;
      status = 'started';
    } else {
      // Streak broken
      newStreak = 1;
      status = 'reset';
    }

    console.log(`Updating streak to ${newStreak} (Status: ${status})`);

    // Update user
    const { error: updateError } = await db
      .from('users')
      .update({ 
        current_streak: newStreak,
        last_activity_date: today 
      })
      .eq('id', user.id); // Update by primary key

    if (updateError) {
      console.error("Error updating streak:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ streak: newStreak, status });

  } catch (error) {
    console.error("Streak API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
