import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Accept either 'q' (from the new dashboard) or 'email' (from legacy components)
    const query = searchParams.get('q') || searchParams.get('email');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const cleanQuery = query.trim().toLowerCase();
    
    // 1. Try 'users' table, searching by email OR full_name
    let { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*') 
      .or(`email.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
      .limit(10);

    // 2. If not found, try the 'profiles' table (a common Supabase alternative)
    if (!users || users.length === 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
        .limit(10);
        
      if (profiles && profiles.length > 0) users = profiles;
    }

    // 3. If the user genuinely does not exist
    if (!users || users.length === 0) {
      console.log(`Failed Search: ${cleanQuery} not found in DB.`);
      return NextResponse.json({ 
        error: `No accounts found matching "${cleanQuery}".` 
      }, { status: 404 });
    }

    // 4. Map the IDs and fetch progression for ALL matched users
    const mappedUsers = await Promise.all(users.map(async (user) => {
      const targetId = user.auth_id || user.id || user.user_id;

      const { data: progression } = await supabaseAdmin
        .from('user_progression')
        .select('current_week')
        .eq('user_id', targetId)
        .maybeSingle();

      return {
        ...user,
        auth_id: targetId,
        full_name: user.full_name || user.name || user.first_name || "Intern",
        email: user.email,
        track: user.track || user.course || "General",
        current_week: progression?.current_week || 1
      };
    }));

    // 5. Return the array (for new UI) and the first user as 'user' (for old UI)
    return NextResponse.json({ 
      users: mappedUsers,
      user: mappedUsers[0] 
    });
    
  } catch (error: any) {
    console.error("Search Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}