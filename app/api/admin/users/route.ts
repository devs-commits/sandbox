import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'student' or 'recruiter'

  try {
    const supabaseServer = createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (type === 'student') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else if (type === 'recruiter') {
      const { data, error } = await supabaseAdmin
        .from('recruiters')
        .select('*');

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
        return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
