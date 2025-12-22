import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, inviteCode } = await request.json();

    if (!userId || !inviteCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;

    // 1. Find Squad by Invite Code
    const { data: squad, error: squadError } = await db
      .from('squads')
      .select('id, name')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (squadError || !squad) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // 2. Check if Squad is full (Max 4)
    const { count, error: countError } = await db
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('squad_id', squad.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count !== null && count >= 4) {
      return NextResponse.json({ error: 'Squad is full' }, { status: 400 });
    }

    // 3. Check if user is already in a squad (optional, but good practice)
    const { data: existingMembership } = await db
      .from('squad_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already in a squad' }, { status: 400 });
    }

    // 4. Add Member
    const { error: joinError } = await db
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: userId,
        role: 'member'
      });

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, squadName: squad.name });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
