// =========================================================
// Minimal in-memory session store (no dependency).
// Session id is a random token stored in an HttpOnly cookie.
// Good fit for a small single-admin site; sessions reset if
// the process restarts (acceptable trade-off, documented in
// the README).
// =========================================================
const crypto = require('crypto');

const SESSION_COOKIE = 'mkk_sid';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const sessions = new Map(); // id -> { data: {...}, expiresAt }

function sweepExpired() {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (entry.expiresAt < now) sessions.delete(id);
  }
}
setInterval(sweepExpired, 15 * 60 * 1000).unref();

function createSessionId() {
  return crypto.randomBytes(24).toString('hex');
}

// Attaches req.session (plain object, auto-persisted) based on the
// request's cookie, creating a new session lazily only when something
// is written to req.session for the first time.
function sessionMiddleware(req, res, next) {
  const cookies = req.cookies || {};
  let sid = cookies[SESSION_COOKIE];
  let entry = sid ? sessions.get(sid) : null;

  if (entry && entry.expiresAt < Date.now()) {
    sessions.delete(sid);
    entry = null;
  }

  let created = false;
  if (!entry) {
    sid = createSessionId();
    entry = { data: {}, expiresAt: Date.now() + SESSION_TTL_MS };
    sessions.set(sid, entry);
    created = true;
  }

  req.session = entry.data;
  req.session.destroy = (cb) => {
    sessions.delete(sid);
    res.setCookie(SESSION_COOKIE, '', { maxAge: 0 });
    if (cb) cb();
  };

  // Refresh expiry on activity + (re)issue the cookie so the browser
  // always has a valid, non-expired session id.
  entry.expiresAt = Date.now() + SESSION_TTL_MS;
  res.setCookie(SESSION_COOKIE, sid, { maxAge: SESSION_TTL_MS });

  next();
}

module.exports = { sessionMiddleware, SESSION_COOKIE };
