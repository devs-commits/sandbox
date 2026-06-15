// app/api/cron/monday/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getIdentityForWeek, getCurriculumStep } from '@/lib/curriculum';
import { sendMondayActivationPassedEmail, sendMondayActivationPendingEmail } from '@/lib/emailUtils'; // Adjust path to where you saved the email functions

// MUST use the service_role key to bypass RLS in a background cron job
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    // 1. Security Check: Block unauthorized pings
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all students and their progression
    // Assuming your users table relates to user_progression
    const { data: progressions, error } = await supabaseAdmin
      .from('user_progression')
      .select('*, users!inner(email, first_name, track)');

    if (error) throw error;

    for (const prog of progressions || []) {
      const user = prog.users;
      const currentWeek = prog.current_week;
      const status = prog.week_status;

      // Condition A: Student Passed Last Week
      if (status === 'passed_waiting') {
        const nextWeek = currentWeek + 1;
        if (nextWeek > 24) continue; // Cap at 24 weeks

        const trackKey = user.track.toLowerCase().replace(/ |-/, "_");
        const newIdentity = getIdentityForWeek(trackKey, nextWeek);
        const stepData = getCurriculumStep(trackKey, nextWeek);

        // 1. Update Database (Unlock Next Task)
        await supabaseAdmin
          .from('user_progression')
          .update({
            current_week: nextWeek,
            current_identity: newIdentity,
            week_status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', prog.user_id);

        // 2. Send the "Passed / Next Task Ready" Email
        await sendMondayActivationPassedEmail(
          user.email,
          user.first_name,
          nextWeek,
          user.track,
          stepData.topic,
          stepData.objective
        );
        console.log(`✅ Unlocked Week ${nextWeek} for ${user.first_name}`);
      }

      // Condition B: Student is Stuck/Failing
      else if (status === 'needs_revision') {
        // Send the "Pending / Catch Up" Email
        await sendMondayActivationPendingEmail(
          user.email,
          user.first_name,
          currentWeek
        );
        console.log(`⏸️ Held ${user.first_name} at Week ${currentWeek}`);
      }
    }

    return NextResponse.json({ message: 'Monday rollout completed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Monday Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}