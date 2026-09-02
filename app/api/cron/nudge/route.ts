import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurriculumStep } from '@/lib/curriculum';
import { sendNeedsRevisionNudgeEmail } from '@/lib/zeptomail';

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

    // 2. Fetch only students actively stuck in 'needs_revision' (No inline join)
    const { data: progressions, error } = await supabaseAdmin
      .from('user_progression')
      .select('*')
      .eq('week_status', 'needs_revision');

    if (error) throw error;

    for (const prog of progressions || []) {
      // 3. Securely fetch the user data directly to avoid relationship cache errors
      let { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name, track')
        .eq('auth_id', prog.user_id)
        .maybeSingle();

      // Fallback if they are using numeric IDs
      if (!user && /^\d+$/.test(prog.user_id)) {
        const { data: userById } = await supabaseAdmin
          .from('users')
          .select('email, full_name, track')
          .eq('id', prog.user_id)
          .maybeSingle();
        user = userById;
      }

      if (!user || !user.email) {
        console.log(`⚠️ Could not find valid user for progression record: ${prog.user_id}`);
        continue;
      }

      const fullName = user.full_name || "Intern";
      const firstName = fullName.split(' ')[0];
      const week = prog.current_week;
      const stepData = getCurriculumStep(user.track, week);
      
      let score = "< 50"; 
      let feedback = "Please review Sola's recent feedback in your dashboard terminal.";

      // 4. Querying your actual 'submissions' table
      const { data: lastSubmission } = await supabaseAdmin
        .from('submissions') 
        .select('score, feedback')
        .eq('user_id', prog.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed to maybeSingle to prevent crashing if no submission exists

      if (lastSubmission) {
        // Fallback to the default strings if the DB columns are null
        score = lastSubmission.score || score;
        feedback = lastSubmission.feedback || feedback;
      }

      // 5. Send the Nudge Email
      await sendNeedsRevisionNudgeEmail(
        user.email,
        firstName, // Passed the dynamically split first name
        week,
        stepData.topic,
        score,
        feedback
      );
      console.log(`🔔 Sent 4 PM Nudge to ${firstName} for Week ${week}`);
    }

    return NextResponse.json({ message: '4 PM Nudges sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Nudge Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}