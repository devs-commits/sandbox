export async function sendNeedsRevisionNudgeEmail(
  email: string,
  name: string,
  week: number,
  topic: string,
  score: string | number,
  feedback: string
) {
  try {
    console.log(`
📩 [EMAIL MOCK]: Needs Revision Nudge
Name: ${name}
Email: ${email}
Week: ${week}
Topic: ${topic}
Score: ${score}
Feedback: ${feedback}
    `);

    return { success: true };
  } catch (error) {
    console.error("Failed to send revision nudge email:", error);
    return { success: false, error };
  }
}

export async function sendMondayActivationPassedEmail(
  email: string,
  name: string,
  weekNumber: number,
  track: string,
  topic: string,
  objective: string
) {
  try {
    console.log(`
📩 [EMAIL MOCK]: Monday Activation Passed
Name: ${name}
Email: ${email}
Week: ${weekNumber}
Track: ${track}
Topic: ${topic}
Objective: ${objective}
    `);

    return { success: true };
  } catch (error) {
    console.error("Failed to send activation passed email:", error);
    return { success: false, error };
  }
}

export async function sendMondayActivationPendingEmail(
  email: string,
  name: string,
  currentWeek: number
) {
  try {
    console.log(`
📩 [EMAIL MOCK]: Monday Activation Pending
Name: ${name}
Email: ${email}
Current Week: ${currentWeek}
    `);

    return { success: true };
  } catch (error) {
    console.error("Failed to send activation pending email:", error);
    return { success: false, error };
  }
}