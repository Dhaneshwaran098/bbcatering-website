// =========================================================
// Run this once to generate a password hash for your .env file:
//
//   node scripts/hash-password.js "yourChosenPassword"
//
// Copy the printed hash into ADMIN_PASSWORD_HASH in your .env file.
// =========================================================
const { hashPassword } = require('../lib/password');

const plain = process.argv[2];

if (!plain) {
  console.log('\nUsage: node scripts/hash-password.js "yourChosenPassword"\n');
  process.exit(1);
}

const hash = hashPassword(plain);
console.log('\nAdd this line to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
