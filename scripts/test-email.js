const path = require('path');
const { loadEnv } = require('../lib/dotenv');

loadEnv(path.join(__dirname, '..', '.env'));

const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('\n📧 Testing SMTP Email Configuration...\n');

  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const targetEmail = process.env.ADMIN_EMAIL || 'bbcateringsocialmedia@gmail.com';
  const from = process.env.EMAIL_FROM || `"BB Catering" <${user || targetEmail}>`;

  if (!host || !user || !pass) {
    console.log('⚠️  SMTP credentials are not configured in your .env file yet:');
    console.log(`   - SMTP_HOST: ${host || '(empty)'}`);
    console.log(`   - SMTP_PORT: ${port}`);
    console.log(`   - SMTP_USER: ${user || '(empty)'}`);
    console.log(`   - SMTP_PASS: ${pass ? '••••••••' : '(empty)'}`);
    console.log('\n📋 How to configure Gmail SMTP (2 minutes):');
    console.log('   1. Go to: https://myaccount.google.com/apppasswords');
    console.log('      (Note: 2-Step Verification must be enabled on the Google Account first)');
    console.log('   2. Create a new App Password named "BB Catering"');
    console.log('   3. Google will give you a 16-character password (e.g. "abcd efgh ijkl mnop")');
    console.log('   4. Add these lines to your .env file:');
    console.log('      SMTP_HOST=smtp.gmail.com');
    console.log('      SMTP_PORT=465');
    console.log(`      SMTP_USER=${targetEmail}`);
    console.log('      SMTP_PASS=your-16-character-app-password');
    console.log(`      EMAIL_FROM="BB Catering" <${targetEmail}>`);
    console.log('\n💡 Note: In development mode, the system automatically prints the OTP code');
    console.log('   directly to your terminal console so you can test password reset right away!\n');
    return;
  }

  console.log(`📡 Connecting to SMTP server ${host}:${port}...`);
  console.log(`   User: ${user}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Server Connection Verified Successfully!\n');

    console.log(`📨 Sending a test verification email to: ${targetEmail}...`);
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '🧪 BB Catering - SMTP Email Test',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #ebd8b7;border-radius:10px;">
          <h2 style="color:#8e1b1b;margin-top:0;">BB Catering Email Test</h2>
          <p>If you received this message, your SMTP email setup is <strong>working perfectly!</strong></p>
          <p>Password reset OTPs will now be delivered directly to this inbox.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <small style="color:#888;">BB Catering &bull; Madurai Koorai Kadai, Mambakkam, Chennai</small>
        </div>
      `,
    });

    console.log('🎉 Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Check your inbox at: ${targetEmail}\n`);
  } catch (err) {
    console.error('\n❌ SMTP Error:', err.message);
    if (err.message && err.message.includes('Username and Password not accepted')) {
      console.error('\n💡 For Gmail: You must use a 16-character Google "App Password", not your normal login password.');
      console.error('   Generate one at: https://myaccount.google.com/apppasswords\n');
    }
  }
}

testEmail();
