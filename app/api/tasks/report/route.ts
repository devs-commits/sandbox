import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 2. Alert Trigger (You can replace this console.log with a ZeptoMail email later)
    if (category === "Technical Bug") {
      console.log(`🚨 CRITICAL BUG REPORTED [${track}]: ${issueDetail}`);
      // await sendZeptoMailAlert(...)
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report Issue API Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}