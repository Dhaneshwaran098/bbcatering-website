const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Sends a password reset OTP email to the admin
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.username
 * @param {string} options.otpCode
 */
async function sendPasswordResetOtp({ toEmail, username, otpCode }) {
  console.log('\n======================================================');
  console.log('🔑  [ADMIN PASSWORD RESET OTP]');
  console.log(`    Recipient: ${toEmail} (${username})`);
  console.log(`    OTP Code:  👉 ${otpCode} 👈 (Valid for 10 minutes)`);
  console.log('======================================================\n');

  const transporter = getTransporter();

  if (!transporter) {
    console.log('ℹ️  SMTP is not configured in .env. The OTP was printed above for testing.');
    console.log('   To send real emails, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.\n');
    return { ok: true, delivered: false, devCode: otpCode };
  }

  const from = process.env.EMAIL_FROM || `"BB Catering" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #2d261e; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebd8b7; }
        .brand { text-align: center; margin-bottom: 24px; }
        .brand h2 { color: #8e1b1b; margin: 6px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
        .brand p { color: #8c7863; margin: 2px 0 0; font-size: 13px; }
        h1 { font-size: 20px; color: #1e1915; margin: 0 0 12px; text-align: center; }
        p { font-size: 14.5px; line-height: 1.6; color: #52473c; margin: 0 0 16px; }
        .otp-box { background: #fff8ef; border: 2px dashed #d97706; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #b45309; }
        .timer { font-size: 12.5px; color: #92400e; margin-top: 6px; font-weight: 600; }
        .footer { font-size: 12px; color: #9e8e7a; text-align: center; margin-top: 28px; border-top: 1px solid #f1e6d3; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">
          <h2>BB CATERING</h2>
          <p>Where Every Feast Feels Special</p>
        </div>
        <h1>Password Reset Request</h1>
        <p>Hello <strong>${username}</strong>,</p>
        <p>We received a request to reset your BB Catering admin dashboard password. Enter the one-time verification code below to proceed:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
          <div class="timer">⏰ Valid for 10 minutes only</div>
        </div>

        <p>If you did not request this password reset, please ignore this email or review your account security immediately.</p>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} BB Catering. Madurai Koorai Kadai, Mambakkam, Chennai.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `🔑 ${otpCode} is your BB Catering Admin Password Reset Code`,
      text: `Your BB Catering Admin password reset OTP code is: ${otpCode}. It expires in 10 minutes.`,
      html: htmlContent,
    });
    console.log(`✅ Reset OTP email sent to ${toEmail} (MessageId: ${info.messageId})`);
    return { ok: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send reset email via SMTP:', err.message);
    return { ok: false, error: err.message, devCode: otpCode };
  }
}

module.exports = {
  sendPasswordResetOtp,
};
