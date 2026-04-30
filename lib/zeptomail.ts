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