const crypto = require('crypto');
const { Router } = require('../lib/router');
const router = new Router();
const { hashPassword, verifyPassword } = require('../lib/password');
const supabase = require('../lib/supabase');
const { sendPasswordResetOtp } = require('../lib/email');

const LOGIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 8;
const attemptsByIp = new Map(); // simple in-memory throttle, resets on restart

function tooManyAttempts(ip) {
  const entry = attemptsByIp.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_ATTEMPT_WINDOW_MS) {
    attemptsByIp.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const entry = attemptsByIp.get(ip);
  if (!entry || Date.now() - entry.first > LOGIN_ATTEMPT_WINDOW_MS) {
    attemptsByIp.set(ip, { first: Date.now(), count: 1 });
  } else {
    entry.count += 1;
  }
}

// ---------- Login page ----------
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', {
    error: null,
    msg: req.query.msg || null,
    next: req.query.next || '/admin',
  });
});

router.post('/login', async (req, res) => {
  const ip = req.ip;
  const nextUrl = (req.body.next && req.body.next.startsWith('/admin')) ? req.body.next : '/admin';

  if (tooManyAttempts(ip)) {
    return res.status(429).render('admin/login', {
      error: 'Too many login attempts. Please wait a few minutes and try again.',
      msg: null,
      next: nextUrl,
    });
  }

  const { username, password } = req.body;
  const identifier = (username || '').trim();
  const plainPass = password || '';

  if (!identifier || !plainPass) {
    return res.status(400).render('admin/login', {
      error: 'Please enter both username and password.',
      msg: null,
      next: nextUrl,
    });
  }

  let authenticated = false;
  let adminUsername = identifier;
  let adminEmail = '';

  // 1. Try authenticating against Supabase admin_users table
  if (supabase.isConfigured()) {
    try {
      const dbUser = await supabase.findAdminUser(identifier);
      if (dbUser && dbUser.password_hash) {
        if (verifyPassword(plainPass, dbUser.password_hash)) {
          authenticated = true;
          adminUsername = dbUser.username;
          adminEmail = dbUser.email;
          req.session.adminId = dbUser.id;
        }
      }
    } catch (err) {
      console.warn('Database auth error, attempting fallback:', err.message);
    }
  }

  // 2. Fallback to .env configuration if not matched in database
  if (!authenticated) {
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envHash = process.env.ADMIN_PASSWORD_HASH || '';
    if (identifier.toLowerCase() === envUser.toLowerCase() && envHash && verifyPassword(plainPass, envHash)) {
      authenticated = true;
      adminUsername = envUser;
      adminEmail = process.env.ADMIN_EMAIL || 'bbcateringsocialmedia@gmail.com';

      // Auto-sync into Supabase admin_users if configured and table exists
      if (supabase.isConfigured()) {
        supabase.findAdminUser(envUser).then((existing) => {
          if (!existing) {
            supabase.createAdminUser({
              username: envUser,
              email: adminEmail,
              password_hash: envHash,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }
  }

  if (!authenticated) {
    recordFailedAttempt(ip);
    return res.status(401).render('admin/login', {
      error: 'Incorrect username or password.',
      msg: null,
      next: nextUrl,
    });
  }

  req.session.isAdmin = true;
  req.session.adminUser = adminUsername;
  req.session.adminEmail = adminEmail;
  res.redirect(nextUrl);
});

// ---------- Forgot Password (Send OTP) ----------
router.get('/forgot-password', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/forgot-password', {
    error: null,
    msg: req.query.msg || null,
  });
});

router.post('/forgot-password', async (req, res) => {
  const identifier = (req.body.identifier || '').trim();
  if (!identifier) {
    return res.render('admin/forgot-password', {
      error: 'Please enter your admin username or registered email.',
      msg: null,
    });
  }

  let adminUser = null;
  if (supabase.isConfigured()) {
    try {
      adminUser = await supabase.findAdminUser(identifier);
    } catch (err) {
      console.warn('Error querying admin user:', err.message);
    }
  }

  // Fallback to .env admin if database user not created yet
  if (!adminUser) {
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envEmail = process.env.ADMIN_EMAIL || 'bbcateringsocialmedia@gmail.com';
    if (
      identifier.toLowerCase() === envUser.toLowerCase() ||
      identifier.toLowerCase() === envEmail.toLowerCase()
    ) {
      if (supabase.isConfigured()) {
        try {
          adminUser = await supabase.createAdminUser({
            username: envUser,
            email: envEmail,
            password_hash: process.env.ADMIN_PASSWORD_HASH || hashPassword('admin123'),
          });
        } catch (e) {
          console.warn('Could not auto-create admin user in Supabase:', e.message);
        }
      }
    }
  }

  if (!adminUser) {
    return res.render('admin/forgot-password', {
      error: `No admin account found for "${identifier}". Please check your username or email.`,
      msg: null,
    });
  }

  // Generate 6-digit random OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();

  // Save OTP in Supabase
  if (supabase.isConfigured()) {
    try {
      await supabase.createOtp({
        user_id: adminUser.id,
        otp_code: otpCode,
        purpose: 'password_reset',
        minutesValid: 10,
      });
    } catch (err) {
      console.error('Failed to save OTP to database:', err.message);
      return res.render('admin/forgot-password', {
        error: 'Database error generating OTP. Please make sure the admin_otps table exists.',
        msg: null,
      });
    }
  }

  // Send OTP Email
  await sendPasswordResetOtp({
    toEmail: adminUser.email,
    username: adminUser.username,
    otpCode,
  });

  // Redirect to reset password page with identifier prefilled
  res.redirect(`/admin/reset-password?identifier=${encodeURIComponent(adminUser.email)}&sent=1`);
});

// ---------- Reset Password (Verify OTP & Update) ----------
router.get('/reset-password', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  const identifier = req.query.identifier || '';
  const sent = req.query.sent === '1';
  res.render('admin/reset-password', {
    identifier,
    error: null,
    msg: sent ? 'A 6-digit OTP code has been sent to your email. Please check your inbox (and server console in dev mode).' : null,
  });
});

router.post('/reset-password', async (req, res) => {
  const identifier = (req.body.identifier || '').trim();
  const otp = (req.body.otp || '').trim();
  const password = req.body.password || '';
  const confirmPassword = req.body.confirmPassword || '';

  if (!identifier || !otp || !password) {
    return res.render('admin/reset-password', {
      identifier,
      error: 'Please fill in all fields (username/email, OTP code, and new password).',
      msg: null,
    });
  }

  if (password.length < 6) {
    return res.render('admin/reset-password', {
      identifier,
      error: 'Password must be at least 6 characters long.',
      msg: null,
    });
  }

  if (password !== confirmPassword) {
    return res.render('admin/reset-password', {
      identifier,
      error: 'Passwords do not match. Please re-enter them carefully.',
      msg: null,
    });
  }

  let adminUser = null;
  if (supabase.isConfigured()) {
    try {
      adminUser = await supabase.findAdminUser(identifier);
    } catch (e) {}
  }

  if (!adminUser) {
    return res.render('admin/reset-password', {
      identifier,
      error: 'Admin account not found.',
      msg: null,
    });
  }

  // Verify OTP
  if (!supabase.isConfigured()) {
    return res.render('admin/reset-password', {
      identifier,
      error: 'Database not connected to verify OTP.',
      msg: null,
    });
  }

  const verification = await supabase.verifyAndConsumeOtp(adminUser.id, otp);
  if (!verification.valid) {
    return res.render('admin/reset-password', {
      identifier,
      error: verification.error || 'Invalid or expired OTP code.',
      msg: null,
    });
  }

  // OTP verified! Hash new password and update
  const newHash = hashPassword(password);
  await supabase.updateAdminPassword(adminUser.id, newHash);

  console.log(`✅ Password reset successfully for admin user: ${adminUser.username} (${adminUser.email})`);

  res.redirect('/admin/login?msg=' + encodeURIComponent('Password reset successfully! Please log in with your new password.'));
});

// ---------- Logout ----------
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
