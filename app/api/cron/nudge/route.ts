// app/api/cron/nudge/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurriculumStep } from '@/lib/curriculum';
import { sendNeedsRevisionNudgeEmail } from '@/lib/emailUtils'; // Adjust path

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch only students actively stuck in 'needs_revision'
    const { data: progressions, error } = await supabaseAdmin
      .from('user_progression')
      .select('*, users!inner(email, first_name, track)')
      .eq('week_status', 'needs_revision');

    if (error) throw error;

    for (const prog of progressions || []) {
      const user = prog.users;
      const week = prog.current_week;
      const stepData = getCurriculumStep(user.track, week);
      
      let score = "< 50"; 
      let feedback = "Please review Sola's recent feedback in your dashboard terminal.";

      // 🎯 UPDATED: Querying your actual 'submissions' table
      const { data: lastSubmission } = await supabaseAdmin
        .from('submissions') 
        .select('score, feedback')
        .eq('user_id', prog.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSubmission) {
        // Fallback to the default strings if the DB columns are null
        score = lastSubmission.score || score;
        feedback = lastSubmission.feedback || feedback;
      }

      // 3. Send the Nudge Email
      await sendNeedsRevisionNudgeEmail(
        user.email,
        user.first_name,
        week,
        stepData.topic,
        score,
        feedback
      );
      console.log(`🔔 Sent 4 PM Nudge to ${user.first_name} for Week ${week}`);
    }

    return NextResponse.json({ message: '4 PM Nudges sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Nudge Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}