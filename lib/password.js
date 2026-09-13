// =========================================================
// Password hashing using Node's built-in crypto.scrypt.
// No external dependency (like bcrypt) required — keeps
// the project installable anywhere with zero native builds.
// =========================================================
const crypto = require('crypto');

const KEY_LEN = 64;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const attempted = crypto.scryptSync(plain, salt, KEY_LEN).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(attempted, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashPassword, verifyPassword };
