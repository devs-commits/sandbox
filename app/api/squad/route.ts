import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = supabaseAdmin || supabase;

  // 1. Find which squad the user belongs to
  const { data: membership, error: memberError } = await db
    .from('squad_members')
    .select('squad_id, role')
    .eq('user_id', userId)
    .single();

  if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ squad: null });
  }

  // 2. Get squad details
  const { data: squad, error: squadError } = await db
    .from('squads')
    .select('*')
    .eq('id', membership.squad_id)
    .single();

  if (squadError) {
    return NextResponse.json({ error: squadError.message }, { status: 500 });
  }

  // 3. Get all members of this squad
  const { data: members, error: membersError } = await db
    .from('squad_members')
    .select('user_id, role, joined_at')
    .eq('squad_id', membership.squad_id);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  // 4. Fetch user details manually to avoid FK relationship issues
  const userIds = members.map((m: any) => m.user_id);
  const { data: users, error: usersError } = await db
    .from('users')
    .select('auth_id, full_name')
    .in('auth_id', userIds);
    
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Map users back to members
  const membersWithDetails = members.map((m: any) => {
    const user = users?.find((u: any) => u.auth_id === m.user_id);
    return {
      userId: m.user_id,
      name: user?.full_name || 'Unknown User',
      role: m.role,
      avatarUrl: null, // Removed avatar_url as it doesn't exist in schema
      joinedAt: m.joined_at
    };
  });

  return NextResponse.json({
    squad: {
      ...squad,
      members: membersWithDetails
    }
  });
}

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;

    // 0. Check if user is already in a squad
    const { data: existingMembership } = await db
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return NextResponse.json({ 
        error: 'User is already in a squad',
        code: 'ALREADY_IN_SQUAD' 
      }, { status: 400 });
    }

    // Generate a random 6-character invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create Squad
    const { data: squad, error: createError } = await db
      .from('squads')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: userId
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 2. Add Creator as Leader
    const { error: memberError } = await db
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: userId,
        role: 'leader'
      });

    if (memberError) {
      // Rollback squad creation if member insertion fails (manual rollback since no transactions in simple REST)
      await db.from('squads').delete().eq('id', squad.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ squad });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
