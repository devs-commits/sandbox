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

    const { data: recruiter, error: recruiterError } = await supabaseServer
      .from('users')
      .select(`
        *,
        company_name,
        industry,
        location,
        website,
        phone,
        subscription_plan,
        subscription_status,
        subscription_expires_at,
        created_at
      `)
      .eq('auth_id', id)
      .eq('role', 'recruiter')
      .single();

    if (recruiterError) {
      return NextResponse.json(
        { success: false, error: 'Recruiter not found' },
        { status: 404 }
      );
    }

    const fullProfileData = {
      companyName: recruiter.company_name || recruiter.full_name,
      industry: recruiter.industry || 'Technology',
      location: recruiter.location || 'N/A',
      website: recruiter.website || 'N/A',
      phone: recruiter.phone || 'N/A',
      plan: recruiter.subscription_plan || 'Monthly',
      subscriptionStatus: recruiter.subscription_status || 'Active',
      expiration: recruiter.subscription_expires_at ? new Date(recruiter.subscription_expires_at).toLocaleDateString() : 'N/A',
      candidatesViewed: Math.floor(Math.random() * 50) + 10,
      messagesSent: Math.floor(Math.random() * 30) + 5,
      companySize: '50-200 employees'
    };

    return NextResponse.json({
      success: true,
      data: fullProfileData
    });

  } catch (error) {
    console.error('Error fetching recruiter profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
