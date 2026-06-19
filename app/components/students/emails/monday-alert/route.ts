import { NextRequest, NextResponse } from "next/server";
import { sendMondayActivationPassedEmail } from "@/lib/zeptomail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, email, name, nextWeek, trackName, nextWeekTopic, nextWeekOutcome } = body;

    // 1. Verify this request is actually coming from your Python Cron script
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Fire the beautifully formatted ZeptoMail template
    if (email) {
      await sendMondayActivationPassedEmail(
        email, 
        name, 
        nextWeek, 
        trackName, 
        nextWeekTopic, 
        nextWeekOutcome
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Monday Email Trigger Failed:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}