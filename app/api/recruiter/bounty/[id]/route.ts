import { createSupabaseClientFromRequest } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
    try {
        const supabase = createSupabaseClientFromRequest(request);
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: recruiter, error: recruiterError } = await supabase
            .from('recruiters')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (recruiterError || !recruiter) {
            return NextResponse.json({ success: false, error: 'Recruiter profile not found' }, { status: 404 });
        }

        const { id } = await params;

        // Verify the bounty belongs to the recruiter before deleting
        const { data: bounty, error: bountyFetchError } = await supabase
            .from('bounties')
            .select('id')
            .eq('id', id)
            .eq('recruiter_id', recruiter.id)
            .single();

        if (bountyFetchError || !bounty) {
            return NextResponse.json({ success: false, error: 'Bounty not found or unauthorized' }, { status: 404 });
        }

        // Perform deletion
        const { error: deleteError } = await supabase
            .from('bounties')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Bounty deleted successfully' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
