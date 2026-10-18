// =========================================================
// Data Store with Supabase Cloud Database + Local Fallback Cache
//
// When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env,
// this store connects to Supabase as the source of truth.
// If Supabase is not configured yet, it runs seamlessly on local
// JSON files in the data/ folder.
// =========================================================
const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readJSON(name, fallback) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    console.warn(`Warning reading ${name}.json:`, err.message);
    return fallback;
  }
}

function writeJSON(name, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const target = filePath(name);
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, target);
  } catch (err) {
    console.warn(`Warning writing ${name}.json:`, err.message);
  }
}

function generateId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

// In-memory cache for fast synchronous access and graceful offline fallback
const cache = {
  dishes: readJSON('dishes', []),
  menus: readJSON('menus', []),
  gallery: readJSON('gallery', []),
  videos: readJSON('videos', []),
  enquiries: readJSON('enquiries', []),
  settings: readJSON('settings', {}),
  initialized: false,
};

// Initialize and sync cache from Supabase on startup
async function init() {
  if (!supabase.isConfigured()) {
    console.log('ℹ️  Supabase credentials not found in .env — using local JSON data store.');
    console.log('   To connect Supabase, see supabase-schema.sql and set SUPABASE_URL in .env.\n');
    cache.initialized = true;
    return false;
  }

  try {
    console.log('🔌 Connecting to Supabase...');
    const test = await supabase.testConnection();
    if (!test.ok) {
      console.warn('⚠️  Supabase connection issue:', test.error || test.message);
      console.warn('   Falling back to local cache while running.\n');
      cache.initialized = true;
      return false;
    }

    // Preload all collections from Supabase
    const [dishes, menus, gallery, videos, enquiries, settings] = await Promise.all([
      supabase.getDishes().catch(() => null),
      supabase.getMenus().catch(() => null),
      supabase.getGallery().catch(() => null),
      supabase.getVideos().catch(() => null),
      supabase.getEnquiries().catch(() => null),
      supabase.getSettings().catch(() => null),
    ]);

    if (dishes && dishes.length > 0) {
      cache.dishes = dishes;
      writeJSON('dishes', dishes);
    }
    if (menus && menus.length > 0) {
      cache.menus = menus;
      writeJSON('menus', menus);
    }
    if (gallery && gallery.length > 0) {
      cache.gallery = gallery;
      writeJSON('gallery', gallery);
    }
    if (videos && videos.length > 0) {
      cache.videos = videos;
      writeJSON('videos', videos);
    }
    if (enquiries) {
      cache.enquiries = enquiries;
      writeJSON('enquiries', enquiries);
    }
    if (settings) {
      cache.settings = settings;
      writeJSON('settings', settings);
    }

    cache.initialized = true;
    console.log('⚡ Connected to Supabase! Live data loaded into store.\n');
    return true;
  } catch (err) {
    console.warn('⚠️  Supabase init error, running on local store:', err.message);
    cache.initialized = true;
    return false;
  }
}

// ---------- Synchronous getters for templates and startup ----------
function getCachedSettings() {
  return cache.settings || {};
}

function getCachedUnreadEnquiries() {
  return (cache.enquiries || []).filter((e) => e.status === 'new').length;
}

// ---------- Dishes ----------
async function getDishes() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getDishes();
      if (data) {
        cache.dishes = data;
        writeJSON('dishes', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getDishes error, using cache:', err.message);
    }
  }
  return cache.dishes;
}

async function saveDishes(dishes) {
  cache.dishes = dishes;
  writeJSON('dishes', dishes);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveDishes(dishes);
    } catch (err) {
      console.error('Supabase saveDishes error:', err.message);
    }
  }
  return true;
}

// ---------- Gallery ----------
async function getGallery() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getGallery();
      if (data) {
        cache.gallery = data;
        writeJSON('gallery', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getGallery error, using cache:', err.message);
    }
  }
  return cache.gallery;
}

async function saveGallery(items) {
  cache.gallery = items;
  writeJSON('gallery', items);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveGallery(items);
    } catch (err) {
      console.error('Supabase saveGallery error:', err.message);
    }
  }
  return true;
}

// ---------- Videos ----------
async function getVideos() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getVideos();
      if (data) {
        cache.videos = data;
        writeJSON('videos', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getVideos error, using cache:', err.message);
    }
  }
  return cache.videos;
}

async function saveVideos(videos) {
  cache.videos = videos;
  writeJSON('videos', videos);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveVideos(videos);
    } catch (err) {
      console.error('Supabase saveVideos error:', err.message);
    }
  }
  return true;
}

// ---------- Menus ----------
async function getMenus() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getMenus();
      if (data) {
        cache.menus = data;
        writeJSON('menus', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getMenus error, using cache:', err.message);
    }
  }
  return cache.menus;
}

async function saveMenus(menus) {
  cache.menus = menus;
  writeJSON('menus', menus);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveMenus(menus);
    } catch (err) {
      console.error('Supabase saveMenus error:', err.message);
    }
  }
  return true;
}

// ---------- Enquiries ----------
async function getEnquiries() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getEnquiries();
      if (data) {
        cache.enquiries = data;
        writeJSON('enquiries', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getEnquiries error, using cache:', err.message);
    }
  }
  return cache.enquiries;
}

async function saveEnquiries(enquiries) {
  cache.enquiries = enquiries;
  writeJSON('enquiries', enquiries);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveEnquiries(enquiries);
    } catch (err) {
      console.error('Supabase saveEnquiries error:', err.message);
    }
  }
  return true;
}

async function addEnquiry(data) {
  const newEnquiry = {
    id: generateId('enq_'),
    name: (data.name || '').trim(),
    phone: (data.phone || '').trim(),
    eventType: (data.eventType || data['event-type'] || 'General Enquiry').trim(),
    date: (data.date || '').trim(),
    guests: data.guests ? String(data.guests) : '',
    message: (data.message || '').trim(),
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  cache.enquiries.unshift(newEnquiry); // newest first
  writeJSON('enquiries', cache.enquiries);

  if (supabase.isConfigured()) {
    try {
      await supabase.insertEnquiry(newEnquiry);
    } catch (err) {
      console.error('Supabase insertEnquiry error:', err.message);
    }
  }
  return newEnquiry;
}

// ---------- Settings ----------
async function getSettings() {
  if (supabase.isConfigured()) {
    try {
      const data = await supabase.getSettings();
      if (data) {
        cache.settings = data;
        writeJSON('settings', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSettings error, using cache:', err.message);
    }
  }
  return cache.settings;
}

async function saveSettings(settings) {
  cache.settings = settings;
  writeJSON('settings', settings);
  if (supabase.isConfigured()) {
    try {
      await supabase.saveSettings(settings);
    } catch (err) {
      console.error('Supabase saveSettings error:', err.message);
    }
  }
  return true;
}

module.exports = {
  init,
  isSupabaseConfigured: supabase.isConfigured,
  getDishes,
  saveDishes,
  getMenus,
  saveMenus,
  getGallery,
  saveGallery,
  getVideos,
  saveVideos,
  getEnquiries,
  saveEnquiries,
  addEnquiry,
  getSettings,
  saveSettings,
  getCachedSettings,
  getSettingsSync: getCachedSettings,
  getCachedUnreadEnquiries,
  generateId,
};
