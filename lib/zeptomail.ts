// Keep your existing imports and constants at the top
const ZEPTO_API_URL = "https://api.zeptomail.com/v1.1/email";
const ZEPTO_API_KEY = process.env.ZEPTOMAIL_API_KEY!;
const SENDER_ADDRESS = "noreply@wdc.ng"; 
const SENDER_NAME = "WDC Labs"; 
const LOGO_URL = "https://labs.wdc.ng/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fwdc_labs_logo.e1d65ac3.png&w=256&q=75";

// 🔥 UPDATED: Yahoo-Proof ZeptoMail Sender
async function sendZeptoMail(toEmail: string, toName: string, subject: string, htmlBody: string) {
  try {
    // 1. Generate a basic Plain Text fallback (Crucial for Yahoo Spam Filters)
    // This strips HTML tags and replaces common block elements with newlines.
    const plainTextFallback = htmlBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    const response = await fetch(ZEPTO_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Zoho-enczapikey ${ZEPTO_API_KEY}`,
      },
      body: JSON.stringify({
        // The bounce_address must match the domain you verified in ZeptoMail
        bounce_address: `bounce@wdc.ng`, 
        from: { 
            address: SENDER_ADDRESS, 
            name: SENDER_NAME 
        },
        to: [{ 
            email_address: { address: toEmail, name: toName } 
        }],
        reply_to: [{ 
            address: "support@wdc.ng", 
            name: "WDC Support" 
        }],
        subject: subject,
        htmlbody: htmlBody,
        // 🔥 The missing piece for Yahoo:
        textbody: plainTextFallback,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
        console.error("ZeptoMail Rejection:", JSON.stringify(data, null, 2));
    }
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

// 🟢 INFLOW (Deposit Alert)
export async function sendDepositEmail(email: string, name: string, amount: number, newBalance: number, txRef: string) {
  const subject = `Money In! 🟢 ₦${amount.toLocaleString()}`;
  const dateStr = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #10b981; font-size: 20px; margin-top: 0;">Deposit Successful!</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; color: #475569;">Great news! You have successfully added funds to your WDC Wallet.</p>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;">Amount:</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">₦${amount.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Date:</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Reference:</td><td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 12px;">${txRef}</td></tr>
          </table>
        </div>
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; color: #ffffff;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Available Wallet Balance</p>
          <h2 style="margin: 5px 0 0; font-size: 28px;">₦${newBalance.toLocaleString()}</h2>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🔴 OUTFLOW (Withdrawal Alert)
export async function sendWithdrawalEmail(email: string, name: string, amount: number, newBalance: number, bankName: string, accountName: string, accountNo: string, txId: string) {
  const subject = `Transfer Successful 💸 ₦${amount.toLocaleString()}`;
  const dateStr = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  const maskedAccount = "******" + accountNo.slice(-4);
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;"><img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" /></div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 15px; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; color: #475569;">You just sent <strong>₦${amount.toLocaleString()}</strong> to <strong>${bankName} - ${accountName}</strong>.</p>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
           <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;">Sent To:</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${accountName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Bank:</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${bankName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Amount:</td><td style="padding: 8px 0; font-weight: 600; text-align: right; color: #ef4444;">-₦${amount.toLocaleString()}</td></tr>
          </table>
        </div>
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 5px 0 0; font-size: 28px;">₦${newBalance.toLocaleString()}</h2>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center;"><p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p></div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🔵 DAY 0: WELCOME & IDENTITY SHIFT
export async function sendWelcomeSubscriptionEmail(email: string, name: string) {
  const subject = `Welcome to the Inner Circle, ${name.split(' ')[0]}! 🚀`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;"><img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" /></div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0;">It's Official. You're In.</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; color: #475569;">Your payment was successful and your <strong>WDC Virtual Office</strong> is now active. You didn't just buy a subscription; you just committed to a new version of yourself.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 20px; margin: 25px 0;">
          <p style="margin: 0; font-weight: 600; color: #0f172a;">What happens next?</p>
          <p style="margin: 10px 0 0; font-size: 14px; color: #64748b;">Your first task is waiting for you. Log in now to begin your Day 1 challenge and start building your streak.</p>
        </div>
        <a href="https://labs.wdc.ng/login" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Access My Virtual Office</a>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🟠 RENEWAL REMINDER
export async function sendRenewalReminderEmail(email: string, name: string, daysLeft: number) {
  const subject = `Action Required: ${daysLeft} days until your office access pauses ⏳`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;"><img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" /></div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #eab308; font-size: 20px; margin-top: 0;">Keep Your Momentum Going</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; color: #475569;">You have <strong>${daysLeft} days left</strong> in your current cycle. Please ensure your wallet is funded to avoid progress interruption.</p>
        <div style="background-color: #fefce8; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #fef08a; margin: 25px 0;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #854d0e;">Required for Renewal</p>
          <h2 style="margin: 5px 0 0; font-size: 28px; color: #854d0e;">₦15,000</h2>
        </div>
        <a href="https://labs.wdc.ng/student/wallet" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Fund My Wallet</a>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🔴 ACCESS PAUSED
export async function sendAccessPausedEmail(email: string, name: string) {
  const subject = `Your Virtual Office access has been paused 🛑`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;"><img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" /></div>
      <div style="padding: 30px 20px; text-align: center;">
        <h2 style="color: #ef4444; font-size: 22px; margin-top: 0;">Access Paused</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${name}, your subscription has expired and your wallet had insufficient funds for auto-renewal.</p>
        <a href="https://labs.wdc.ng/student/wallet" style="display: block; background-color: #ef4444; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 20px;">Fund Wallet & Resume</a>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🛒 ABANDONED CART NUDGE (LEADS)
export async function sendAbandonedCartEmail(email: string, name: string) {
  const subject = `Ready to start your journey at WDC Labs? 🚀`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0;">Don't leave your spot empty!</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${name.split(' ')[0]},</p>
        <p style="font-size: 15px; color: #475569;">We noticed you started your registration but didn't quite finish the payment step. Your chosen track is waiting for you, but access is limited.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px dashed #cbd5e1;">
          <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
            Your progress has been saved. You can pick up exactly where you left off.
          </p>
        </div>

        <a href="https://labs.wdc.ng/auth/signup" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Complete My Registration</a>
        
        <p style="font-size: 13px; color: #94a3b8; margin-top: 25px; text-align: center;">
          Having trouble with the payment? Just reply to this email and our support team will help you out manually.
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}


// ============================================================================
// 🎓 WDC LABS ACADEMIC ENGINE EMAILS (TASK RELEASE & PROGRESSION)
// ============================================================================

// 🔴 NEEDS REVISION NUDGE (Daily at 4 PM for failing students)
export async function sendNeedsRevisionNudgeEmail(
  email: string, 
  name: string, 
  weekNumber: number, 
  taskTopic: string, 
  score: number | string, 
  feedbackSummary: string
) {
  const subject = `Feedback Required: Your Week ${weekNumber} Submission`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #ef4444; font-size: 20px; margin-top: 0;">Revision Required</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">We have completed the review of your Week ${weekNumber} task on <strong>${taskTopic}</strong>. Unfortunately, your submission did not meet the minimum passing score of <strong>50%</strong>.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #7f1d1d;"><strong>Your Score:</strong> ${score}%</p>
        </div>

        <p style="font-size: 15px; color: #475569;">At WDC Labs, every task is designed to simulate real workplace expectations. Quality matters, and progression is based on meeting the required standard.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">Sola's Feedback Summary:</p>
          <p style="margin: 0; font-size: 14px; color: #64748b; font-style: italic;">"${feedbackSummary}"</p>
        </div>

        <p style="font-size: 15px; color: #475569;">Review your submission and try again. Once your submission achieves the required pass mark, you will immediately unlock the next task.</p>

        <a href="https://labs.wdc.ng/login" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">Review & Resubmit Here</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">We're rooting for you.<br/>© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🟢 FRIDAY WRAP-UP (Every Friday at 4 PM)
export async function sendFridayWrapUpEmail(
  email: string, 
  name: string, 
  completedWeek: number, 
  trackName: string, 
  weekTopic: string, 
  tasksCompleted: number, 
  skillsDeveloped: string
) {
  const subject = `🏆 Well done on completing Week ${completedWeek}!`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #10b981; font-size: 22px; margin-top: 0;">Week ${completedWeek} Complete!</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">Well done on wrapping up Week ${completedWeek} of your <strong>${trackName}</strong> journey.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">This week, you tackled <strong>${weekTopic}</strong> and successfully completed <strong>${tasksCompleted}</strong> assignments.</p>
          <p style="margin: 15px 0 5px 0; font-weight: 600; color: #0f172a; font-size: 14px;">Skills Developed:</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">${skillsDeveloped}</p>
        </div>

        <p style="font-size: 15px; color: #475569;">These are not just classroom lessons. They are the exact skills you will need when working on real projects, handling real deadlines, and solving real business problems.</p>
        <p style="font-size: 15px; color: #475569;">Take the weekend to rest and recharge. You've earned it.</p>

        <a href="https://labs.wdc.ng/login" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">Review Your Dashboard</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">Keep building.<br/>© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 🔵 SUNDAY BRIDGE (Every Sunday Evening)
export async function sendSundayBridgeEmail(
  email: string, 
  name: string, 
  completedWeekTopic: string, 
  nextWeekTopic: string
) {
  const subject = `🚀 Prep for tomorrow: Here is what's next.`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Get Ready for Monday</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">We hope you had a great weekend and took time to recharge.</p>
        <p style="font-size: 15px; color: #475569;">Last week, you leveled up your skills in <strong>${completedWeekTopic}</strong>. Tomorrow morning at 8:00 AM, the system will release your next set of objectives.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 25px 0;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #16a34a; font-size: 14px;">What to look out for this week:</p>
          <p style="margin: 0; font-size: 14px; color: #15803d;">We will be diving into <strong>${nextWeekTopic}</strong>. Be prepared to apply what you've already learned to a completely new set of workplace challenges.</p>
        </div>

        <p style="font-size: 15px; color: #475569;">Clear your desk, review your past feedback, and get ready to hit the ground running tomorrow morning. See you at 8 AM.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// ⚡ MONDAY ACTIVATION - PASSED (Monday 8 AM for progressing students)
export async function sendMondayActivationPassedEmail(
  email: string, 
  name: string, 
  nextWeek: number, 
  trackName: string, 
  nextWeekTopic: string, 
  nextWeekOutcome: string
) {
  const subject = `⚡ Your New Task Is Ready: Week ${nextWeek}`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0;">Your Desk is Ready.</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">You are now officially moving into <strong>Week ${nextWeek}</strong> of your <strong>${trackName}</strong> track.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 5px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">This Week's Focus</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; font-size: 16px; color: #0f172a;">${nextWeekTopic}</p>
          
          <p style="margin: 0 0 5px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">The Objective</p>
          <p style="margin: 0; font-size: 14px; color: #475569;">${nextWeekOutcome}</p>
        </div>

        <p style="font-size: 15px; color: #475569;">The goal is simple: help you move from learning concepts to applying them in a realistic work environment. Take the tasks seriously. Submit your work. Review your feedback. Improve as you go.</p>

        <a href="https://labs.wdc.ng/login" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">Start Week ${nextWeek} Now</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">You've got this.<br/>© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// ⏸️ MONDAY ACTIVATION - PENDING (Monday 8 AM for failing students)
export async function sendMondayActivationPendingEmail(
  email: string, 
  name: string, 
  currentWeek: number
) {
  const subject = `A New Week: Let's clear your desk, ${name.split(' ')[0]} 💼`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">A New Week Begins</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">A new week has started at WDC Labs! We noticed you are still wrapping up your revisions for <strong>Week ${currentWeek}</strong>.</p>
        
        <p style="font-size: 15px; color: #475569;">In the real world, roadblocks happen and deadlines shift—but the core objective remains the same: delivering high-quality work. We want to see you crush this task.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #eab308; padding: 15px 20px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569;">Use today to review Sola's feedback, consult your resources, and give it another shot. The moment you hit that 50% passing mark, your next task will unlock immediately so you can catch up to the timeline.</p>
        </div>

        <a href="https://labs.wdc.ng/login" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">Head to your desk</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">We're right here with you.<br/>© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// ============================================================================
// 🤝 WDC LABS REFERRAL ENGINE EMAILS
// ============================================================================

// ⏳ REFERRAL PENDING (When someone signs up using their link)
export async function sendReferralPendingEmail(email: string, name: string, referredName: string) {
  const subject = `🎉 You just got a new referral! (Pending)`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Your network is growing!</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">Great news! <strong>${referredName}</strong> just used your unique link to join WDC Labs.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #eab308; padding: 15px 20px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569;">They are currently marked as <strong>Pending (Trial)</strong>. If they successfully convert to a paid subscription after their trial, you will automatically receive a 10% commission straight to your WDC Wallet.</p>
        </div>

        <a href="https://labs.wdc.ng/student/earn" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">View Referral Dashboard</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

// 💰 REFERRAL PAID (When the 10% commission hits their wallet)
export async function sendReferralPaidEmail(email: string, name: string, amount: number, newBalance: number) {
  const subject = `💰 You just got paid! Referral Converted.`;
  const firstName = name.split(' ')[0];
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #10b981; font-size: 22px; margin-top: 0;">Money in the bank! 🚀</h2>
        <p style="font-size: 15px; color: #475569;">Hi ${firstName},</p>
        <p style="font-size: 15px; color: #475569;">One of your pending referrals just converted to a paid WDC Labs subscription!</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;">Commission Earned:</td><td style="padding: 8px 0; font-weight: 600; text-align: right; color: #10b981;">+₦${amount.toLocaleString()}</td></tr>
          </table>
        </div>
        
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; color: #ffffff;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">New Wallet Balance</p>
          <h2 style="margin: 5px 0 0; font-size: 28px;">₦${newBalance.toLocaleString()}</h2>
        </div>

        <a href="https://labs.wdc.ng/student/wallet" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin-top: 25px;">Cash Out Now</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} WDC Labs.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody);
}

export const sendReferralPendingEmail = async (toEmail: string, referrerName: string, referredName: string) => {
  const subject = "🎉 You just got a new referral!";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563EB;">Great news, ${referrerName}!</h2>
      <p>Someone just used your unique WDC Labs link to sign up!</p>
      <p><strong>${referredName}</strong> has successfully created an account.</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>What happens next?</strong><br/>
        This referral is currently marked as <em>Pending</em>. As soon as they complete their trial and subscribe to a paid plan, 10% of their subscription fee will automatically be credited to your WDC Wallet.</p>
      </div>
      <p>Keep sharing your link to stack up those earnings!</p>
      <p>Best,<br/>The WDC Labs Team</p>
    </div>
  `;
  return sendEmail(toEmail, subject, htmlBody);
};

export const sendReferralSuccessEmail = async (toEmail: string, referrerName: string, referredName: string, amount: number) => {
  const subject = "💰 Your referral just paid! Wallet Credited.";
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #10B981;">Cha-ching! 💸</h2>
      <p>Awesome work, ${referrerName}!</p>
      <p>Your referral, <strong>${referredName}</strong>, just successfully subscribed to WDC Labs.</p>
      <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: #065F46;">We have credited your wallet with:</p>
        <h1 style="margin: 10px 0 0 0; color: #047857; font-size: 32px;">${formattedAmount}</h1>
      </div>
      <p>You can withdraw this to your local bank account at any time from your Wallet dashboard.</p>
      <p>Keep up the great work!<br/>The WDC Labs Team</p>
    </div>
  `;
  return sendEmail(toEmail, subject, htmlBody);
};