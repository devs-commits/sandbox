import { createSupabaseClientFromRequest } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createSupabaseClientFromRequest(request);
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get the recruiter's ID from the public.recruiters table using the auth_id
        const { data: recruiter, error: recruiterError } = await supabase
            .from('recruiters')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (recruiterError || !recruiter) {
            return NextResponse.json({ success: false, error: 'Recruiter profile not found' }, { status: 404 });
        }

        // Fetch bounties for this recruiter
        const { data: bounties, error: bountiesError } = await supabase
            .from('bounties')
            .select(`
        *,
        bounty_submissions (count)
      `)
            .eq('recruiter_id', recruiter.id)
            .order('created_at', { ascending: false });

        if (bountiesError) {
            return NextResponse.json({ success: false, error: bountiesError.message }, { status: 500 });
        }

        // Transform data to match frontend expectations if needed, or send as is
        // The frontend expects: id, title, category (type), audience (not in DB?), reward, status, createdAt, participants (count)

        // Note: The DB schema has 'type' which seems to map to 'category' in UI
        // 'audience' is not in the DB schema provided earlier, so we might need to store it in metadata or instructions, or add a column.
        // For now, I'll default audience to 'Both' or check if it fits in 'type' or another field.
        // Actually, looking at the schema: type, duration, reward, slots_total, slots_filled, instructions, deliverables, status.

        return NextResponse.json({ success: true, data: bounties });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.description || !body.reward) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Prepare data for insertion
        // Map frontend 'category' to DB 'type'
        const newBounty = {
            recruiter_id: recruiter.id,
            title: body.title,
            description: body.description,
            type: body.category || 'Standard', // Mapping category to type
            duration: body.estimatedTime,
            reward: parseFloat(body.reward),
            slots_total: parseInt(body.availableSlots) || 1,
            instructions: JSON.stringify(body.instructions ? body.instructions.split('\n') : []), // Split string to array
            deliverables: JSON.stringify(body.deliverables ? body.deliverables.split('\n') : []), // Split string to array
            status: body.status === 'Live' ? 'active' : 'draft', // Map status
            // We might want to store 'audience' and 'submissionFormats' in a metadata column or within instructions/description if strictly needing schema compliance without altering it.
            // For now, let's assume 'type' can hold category. 
        };

        const { data, error } = await supabase
            .from('bounties')
            .insert(newBounty)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
