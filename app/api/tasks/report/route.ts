import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewIssueAdminAlert } from "@/lib/zeptomail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, taskId, track, category, issueDetail, optionalNote } = body;

    if (!userId || !category || !issueDetail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save to Database
    const { error } = await supabaseAdmin
      .from('task_issues')
      .insert({
        user_id: userId,
        task_id: taskId,
        track: track,
        category: category,
        issue_detail: issueDetail,
        optional_note: optionalNote || null,
        status: 'open'
      });

    if (error) throw error;

    // 2. Fetch User Name for the Email Template
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('auth_id', userId)
      .maybeSingle();
      
    const studentName = userRecord?.full_name || "WDC Intern";

    // 3. Fire ZeptoMail Admin Alerts Concurrently
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";

    if (adminEmailsEnv) {
      const adminEmails = adminEmailsEnv.split(",").map(email => email.trim()).filter(Boolean);
      
      Promise.all(
        adminEmails.map(adminEmail => 
          sendNewIssueAdminAlert(adminEmail, studentName, category, issueDetail)
        )
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}