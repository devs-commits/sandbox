const ZEPTO_API_URL = "https://api.zeptomail.com/v1.1/email";
const ZEPTO_API_KEY = process.env.ZEPTOMAIL_API_KEY!;
const SENDER_ADDRESS = "noreply@wdc.ng"; 
const SENDER_NAME = "WDC Labs"; // 🔥 Updated from Warlord Digital Club

const LOGO_URL = "https://labs.wdc.ng/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fwdc_labs_logo.e1d65ac3.png&w=256&q=75";

async function sendZeptoMail(toEmail: string, toName: string, subject: string, htmlBody: string) {
  try {
    const response = await fetch(ZEPTO_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Zoho-enczapikey ${ZEPTO_API_KEY}`,
      },
      body: JSON.stringify({
        from: { address: SENDER_ADDRESS, name: SENDER_NAME },
        to: [{ email_address: { address: toEmail, name: toName } }],
        subject: subject,
        htmlbody: htmlBody,
      }),
    });
    const data = await response.json();
    if (!response.ok) console.error("ZeptoMail Error:", data);
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
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Amount:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">₦${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Date:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Reference:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 12px;">${txRef}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; color: #ffffff;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Available Wallet Balance</p>
          <h2 style="margin: 5px 0 0; font-size: 28px;">₦${newBalance.toLocaleString()}</h2>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Security Tip:</strong> WDC Labs will never ask for your password or withdrawal PIN.</p>
        <p style="margin: 15px 0 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} <a href="https://labs.wdc.ng" style="color: #94a3b8; text-decoration: none; font-weight: bold;">WDC Labs</a>.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody); // 🔥 Added await
}

// 🔴 OUTFLOW (Withdrawal Alert)
export async function sendWithdrawalEmail(email: string, name: string, amount: number, newBalance: number, bankName: string, accountName: string, accountNo: string, txId: string) {
  const subject = `Transfer Successful 💸 ₦${amount.toLocaleString()}`;
  const dateStr = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  const maskedAccount = "******" + accountNo.slice(-4);

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 500px; margin: 0 auto; background-color: #ffffff; color: #1e293b; line-height: 1.6;">
      
      <div style="text-align: center; padding: 30px 0 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="WDC Labs" style="height: 40px; margin: 0 auto; display: block;" />
      </div>

      <div style="padding: 30px 20px;">
        <p style="font-size: 15px; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; color: #475569;">You just sent <strong>₦${amount.toLocaleString()}</strong> to <strong>${bankName} - ${accountName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 15px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Transaction Details</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Sent To:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${accountName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Bank:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${bankName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Account No:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${maskedAccount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Amount:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #ef4444;">-₦${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Date:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Transaction ID:</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; font-size: 12px;">${txId}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; color: #ffffff;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Available Wallet Balance</p>
          <h2 style="margin: 5px 0 0; font-size: 28px;">₦${newBalance.toLocaleString()}</h2>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Did you not authorize this?</strong> Freeze your account instantly from your dashboard and contact support.</p>
        <p style="margin: 15px 0 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} <a href="https://labs.wdc.ng" style="color: #94a3b8; text-decoration: none; font-weight: bold;">WDC Labs</a>.</p>
      </div>
    </div>
  `;
  await sendZeptoMail(email, name, subject, htmlBody); // 🔥 Added await
}