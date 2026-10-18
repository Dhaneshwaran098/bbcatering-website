const path = require('path');
const { loadEnv } = require('../lib/dotenv');

loadEnv(path.join(__dirname, '..', '.env'));

const supabase = require('../lib/supabase');
const { hashPassword } = require('../lib/password');

async function seedAdmin() {
  console.log('\n👤 Seeding Admin User in Supabase...\n');

  if (!supabase.isConfigured()) {
    console.error('❌ Supabase is not configured yet in .env');
    process.exit(1);
  }

  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_EMAIL || 'bbcateringsocialmedia@gmail.com').trim();
  const explicitPassword = process.argv[2];

  let passwordHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (explicitPassword) {
    passwordHash = hashPassword(explicitPassword);
    console.log(`🔐 Using new password provided as argument for "${username}".`);
  } else if (!passwordHash) {
    console.warn('⚠️  ADMIN_PASSWORD_HASH not found in .env.');
    console.warn('   Usage: node scripts/seed-admin.js "yourPassword"');
    process.exit(1);
  }

  try {
    const existing = await supabase.findAdminUser(username) || await supabase.findAdminUser(email);
    if (existing) {
      console.log(`ℹ️  Admin user already exists (ID: ${existing.id}, Username: ${existing.username}, Email: ${existing.email}).`);
      if (explicitPassword) {
        await supabase.updateAdminPassword(existing.id, passwordHash);
        console.log('✅ Admin password updated successfully!');
      } else {
        console.log('✅ Existing admin verified.');
      }
    } else {
      const newUser = await supabase.createAdminUser({
        username,
        email,
        password_hash: passwordHash,
        role: 'admin',
      });
      console.log(`🎉 Admin user created successfully!`);
      console.log(`   - ID:       ${newUser.id}`);
      console.log(`   - Username: ${newUser.username}`);
      console.log(`   - Email:    ${newUser.email}`);
    }
    console.log('\nDone!\n');
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
    if (err.message && err.message.includes('relation "public.admin_users" does not exist')) {
      console.error('\n⚠️  The "admin_users" table has not been created in Supabase yet.');
      console.error('   Please run the new SQL queries at the bottom of supabase-schema.sql in your Supabase SQL editor.\n');
    }
  }
}

seedAdmin();
