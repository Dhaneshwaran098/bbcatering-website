const path = require('path');
const fs = require('fs');
const { loadEnv } = require('../lib/dotenv');

loadEnv(path.join(__dirname, '..', '.env'));

const supabase = require('../lib/supabase');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(name, fallback) {
  try {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read ${name}.json:`, err.message);
    return fallback;
  }
}

async function runMigration() {
  console.log('\n🚀 Starting Supabase Data Migration...\n');

  if (!supabase.isConfigured()) {
    console.error('❌ Supabase is not configured yet in your .env file!');
    console.error('   Please open .env and set:');
    console.error('   SUPABASE_URL=https://your-project-id.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-or-anon-key\n');
    console.error('   Make sure you have also run supabase-schema.sql in the Supabase SQL editor.');
    process.exit(1);
  }

  const connTest = await supabase.testConnection();
  if (!connTest.ok) {
    console.error('❌ Could not connect to Supabase:');
    console.error('   Error:', connTest.error || connTest.message);
    console.error('\n   Please verify:');
    console.error('   1. You ran the tables creation script: supabase-schema.sql in your Supabase SQL editor.');
    console.error('   2. Your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env are correct.\n');
    process.exit(1);
  }

  console.log('✅ Connected to Supabase successfully!\n');

  try {
    // 1. Dishes
    const dishes = readJSON('dishes', []);
    if (dishes.length > 0) {
      console.log(`📦 Migrating ${dishes.length} dishes...`);
      await supabase.saveDishes(dishes);
      console.log(`   ✅ ${dishes.length} dishes migrated.`);
    }

    // 2. Menus
    const menus = readJSON('menus', []);
    if (menus.length > 0) {
      console.log(`📦 Migrating ${menus.length} curated menus...`);
      await supabase.saveMenus(menus);
      console.log(`   ✅ ${menus.length} menus migrated.`);
    }

    // 3. Gallery
    const gallery = readJSON('gallery', []);
    if (gallery.length > 0) {
      console.log(`📦 Migrating ${gallery.length} gallery photos...`);
      await supabase.saveGallery(gallery);
      console.log(`   ✅ ${gallery.length} gallery items migrated.`);
    }

    // 4. Videos
    const videos = readJSON('videos', []);
    if (videos.length > 0) {
      console.log(`📦 Migrating ${videos.length} videos...`);
      await supabase.saveVideos(videos);
      console.log(`   ✅ ${videos.length} videos migrated.`);
    }

    // 5. Enquiries
    const enquiries = readJSON('enquiries', []);
    if (enquiries.length > 0) {
      console.log(`📦 Migrating ${enquiries.length} enquiries...`);
      await supabase.saveEnquiries(enquiries);
      console.log(`   ✅ ${enquiries.length} enquiries migrated.`);
    }

    // 6. Settings
    const settings = readJSON('settings', null);
    if (settings) {
      console.log('📦 Migrating site settings...');
      await supabase.saveSettings(settings);
      console.log('   ✅ Site settings migrated.');
    }

    console.log('\n🎉 ALL DATA SUCCESSFULLY MIGRATED TO SUPABASE!\n');
  } catch (err) {
    console.error('\n❌ Migration failed with error:', err);
    process.exit(1);
  }
}

runMigration();
