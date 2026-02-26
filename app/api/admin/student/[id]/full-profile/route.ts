import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseServer = createSupabaseClientFromRequest(request);
    
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminError } = await supabaseServer
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

    const { data: student, error: studentError } = await supabaseServer
      .from('users')
      .select(`
        *,
        skills,
        average_score,
        last_active_at,
        created_at,
        track,
        bvn,
        nin,
        bank_name,
        account_number,
        full_name,
        email,
        country,
        phone
      `)
      .eq('auth_id', id)
      .single();

    if (studentError) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const { data: taskCount, error: taskError } = await supabaseServer
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', student.id);

    const fullProfileData = {
      realName: student.full_name,
      phone: student.phone,
      location: student.country,
      joinDate: student.created_at ? new Date(student.created_at).toLocaleDateString() : null,
      lastActive: student.last_active_at ? new Date(student.last_active_at).toLocaleString() : null,
      score: student.average_score || 0,
      tasks: taskCount || 0,
      weeks: student.created_at ? Math.floor((new Date().getTime() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0,
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
