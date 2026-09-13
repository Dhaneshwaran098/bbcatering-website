const { Router } = require('../lib/router');
const router = new Router();
const { verifyPassword } = require('../lib/password');

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

router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', {
    error: null,
    next: req.query.next || '/admin',
  });
});

router.post('/login', (req, res) => {
  const ip = req.ip;
  const nextUrl = (req.body.next && req.body.next.startsWith('/admin')) ? req.body.next : '/admin';

  if (tooManyAttempts(ip)) {
    return res.status(429).render('admin/login', {
      error: 'Too many login attempts. Please wait a few minutes and try again.',
      next: nextUrl,
    });
  }

  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedHash = process.env.ADMIN_PASSWORD_HASH || '';

  const validUser = username === expectedUser;
  const validPass = expectedHash && verifyPassword(password || '', expectedHash);

  if (!validUser || !validPass) {
    recordFailedAttempt(ip);
    return res.status(401).render('admin/login', {
      error: 'Incorrect username or password.',
      next: nextUrl,
    });
  }

  req.session.isAdmin = true;
  req.session.adminUser = username;
  res.redirect(nextUrl);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
