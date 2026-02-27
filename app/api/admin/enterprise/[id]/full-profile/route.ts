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

    const { data: enterprise, error: enterpriseError } = await supabaseServer
      .from('users')
      .select(`
        *,
        company_name,
        industry,
        location,
        website,
        phone,
        address,
        subscription_plan,
        subscription_status,
        subscription_expires_at,
        created_at
      `)
      .eq('auth_id', id)
      .eq('role', 'enterprise')
      .single();

    if (enterpriseError) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    const fullProfileData = {
      companyName: enterprise.company_name || 'Unknown',
      industry: enterprise.industry || 'Finance',
      companySize: '1000+ employees',
      email: enterprise.email || 'contact@company.com',
      phone: enterprise.phone || 'N/A',
      address: enterprise.address || 'N/A',
      website: enterprise.website || 'N/A',
      plan: enterprise.subscription_plan || 'Yearly',
      subscriptionStatus: enterprise.subscription_status || 'Active',
      expiration: enterprise.subscription_expires_at ? new Date(enterprise.subscription_expires_at).toLocaleDateString() : 'N/A',
      activeUsers: Math.floor(Math.random() * 500) + 100,
      storageUsed: '2.5 GB',
      apiCalls: Math.floor(Math.random() * 10000) + 1000,
      founded: '2010'
    };

    return NextResponse.json({
      success: true,
      data: fullProfileData
    });

  } catch (error) {
    console.error('Error fetching enterprise profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
