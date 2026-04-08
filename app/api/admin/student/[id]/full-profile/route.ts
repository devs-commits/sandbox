import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use admin client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Authenticate request
    const supabaseServer = createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: adminUser, error: adminError } = await supabaseAdmin!
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { data: student, error: studentError } = await supabaseAdmin!
      .from('users')
      .select(`
        id,
        skills,
        average_score,
        created_at,
        track,
        bvn,
        nin,
        bank_name,
        account_number,
        full_name,
        email,
        country,
        current_streak,
        last_activity_date
      `)
      .eq('auth_id', id)
      .single();

    if (studentError) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const { count: taskCount, error: taskError } = await supabaseAdmin!
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', student.id);

    // Calculate weeks since joining
    const weeksSinceJoining = student.created_at 
      ? Math.floor((new Date().getTime() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 0;

    // Format join date
    const formattedJoinDate = student.created_at 
      ? new Date(student.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : null;

    // Format last activity date
    const formattedLastActivityDate = student.last_activity_date 
      ? new Date(student.last_activity_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : null;

    const fullProfileData = {
      realName: student.full_name,
      location: student.country,
      joinDate: formattedJoinDate,
      lastActive: student.last_activity_date ? new Date(student.last_activity_date).toLocaleString() : null,
      score: Math.round(student.average_score || 0),
      tasks: taskCount || 0,
      weeks: weeksSinceJoining,
      streak: student.current_streak || 0,
      longestStreak: student.current_streak || 0,
      lastTaskDate: formattedLastActivityDate,
      skills: student.skills || [],
      bvn: student.bvn,
      nin: student.nin,
      bankName: student.bank_name,
      accountNumber: student.account_number,
      course: student.track
    };

    return NextResponse.json({
      success: true,
      data: fullProfileData
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
