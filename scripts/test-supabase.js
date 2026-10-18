const path = require('path');
const { loadEnv } = require('../lib/dotenv');

loadEnv(path.join(__dirname, '..', '.env'));

const supabase = require('../lib/supabase');

async function test() {
  console.log('\n🔍 Testing Supabase Connection...\n');

  if (!supabase.isConfigured()) {
    console.log('⚠️  Supabase is not configured yet.');
    console.log('   Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.');
    console.log('   Until configured, the site will automatically run on local JSON files.\n');
    return;
  }

  const res = await supabase.testConnection();
  if (!res.ok) {
    console.error('❌ Connection test failed:');
    console.error('   ' + (res.error || res.message));
    console.log('\n   If the table does not exist, run supabase-schema.sql in your Supabase SQL editor.');
    return;
  }

  console.log('✅ Connection successful!');

  // Test tables
  try {
    const dishes = await supabase.getDishes();
    const menus = await supabase.getMenus();
    const gallery = await supabase.getGallery();
    const videos = await supabase.getVideos();
    const enquiries = await supabase.getEnquiries();
    const settings = await supabase.getSettings();

    console.log('\n📊 Database contents:');
    console.log(`   - Dishes:    ${dishes ? dishes.length : 0} items`);
    console.log(`   - Menus:     ${menus ? menus.length : 0} items`);
    console.log(`   - Gallery:   ${gallery ? gallery.length : 0} items`);
    console.log(`   - Videos:    ${videos ? videos.length : 0} items`);
    console.log(`   - Enquiries: ${enquiries ? enquiries.length : 0} items`);
    console.log(`   - Settings:  ${settings ? 'Configured (' + (settings.businessName || 'BB Catering') + ')' : 'Not set yet'}`);

    if (!dishes || dishes.length === 0) {
      console.log('\n💡 Tip: Your Supabase database is empty. Run:');
      console.log('   npm run migrate:supabase');
      console.log('   to populate all your dishes, menus, gallery, and settings from local data.\n');
    } else {
      console.log('\n🎉 Supabase is fully configured and operational!\n');
    }
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
  }
}

test();
