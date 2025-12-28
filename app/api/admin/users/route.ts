import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'student' or 'recruiter'

  try {
    if (type === 'student') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'student');
        // .order('created_at', { ascending: false }); // Uncomment if created_at exists

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else if (type === 'recruiter') {
      const { data, error } = await supabaseAdmin
        .from('recruiters')
        .select('*');
        // .order('created_at', { ascending: false }); // Uncomment if created_at exists

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
        return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
