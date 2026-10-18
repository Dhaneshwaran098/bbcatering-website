const path = require('path');
const { loadEnv } = require('../lib/dotenv');

loadEnv(path.join(__dirname, '..', '.env'));

const supabase = require('../lib/supabase');

async function updateAdminEmail() {
  const newEmail = process.argv[2];

  if (!newEmail || !newEmail.includes('@')) {
    console.log('\n❌ Please provide a valid email address.');
    console.log('   Usage: node scripts/update-admin-email.js "owner@gmail.com"\n');
    process.exit(1);
  }

  if (!supabase.isConfigured()) {
    console.error('❌ Supabase is not configured in .env');
    process.exit(1);
  }

  const sb = supabase.getClient();
  const username = process.env.ADMIN_USERNAME || 'admin';

  console.log(`\n🔄 Updating admin email to: ${newEmail.trim().toLowerCase()}...`);

  const { data, error } = await sb
    .from('admin_users')
    .update({ 
      email: newEmail.trim().toLowerCase(),
      updated_at: new Date().toISOString()
    })
    .ilike('username', username)
    .select();

  if (error) {
    console.error('❌ Failed to update email in Supabase:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    // If not found by username, update first admin
    const { data: fallbackData, error: fallbackError } = await sb
      .from('admin_users')
      .update({ 
        email: newEmail.trim().toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .neq('id', '___')
      .select();

    if (fallbackError || !fallbackData || fallbackData.length === 0) {
      console.error('❌ No admin user found in database to update.');
      process.exit(1);
    }
  }

  console.log(`✅ Admin email updated to "${newEmail.trim().toLowerCase()}" successfully in Supabase!`);
  console.log('\n💡 Remember to update ADMIN_EMAIL in your .env file as well:\n   ADMIN_EMAIL=' + newEmail.trim().toLowerCase() + '\n');
}

updateAdminEmail();
