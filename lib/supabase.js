const { createClient } = require('@supabase/supabase-js');

// Read configuration from environment variables
function getEnvUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getEnvKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  );
}

let client = null;

function isConfigured() {
  const url = getEnvUrl();
  const key = getEnvKey();
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !key.includes('your-')
  );
}

function getClient() {
  if (!isConfigured()) return null;
  if (!client) {
    client = createClient(getEnvUrl(), getEnvKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

// Map database row to standard JavaScript object for the site
function normalizeDish(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    unit: row.unit || 'per kg',
    spice: Number(row.spice) || 0,
    image: row.image || '',
    featured: Boolean(row.featured),
    created_at: row.created_at,
  };
}

function normalizeMenu(row) {
  if (!row) return null;
  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }
  return {
    id: row.id,
    title: row.title || '',
    name: row.name || '',
    type: row.type || '',
    badge: row.badge || '',
    image: row.image || '',
    items: Array.isArray(items) ? items : [],
  };
}

function normalizeGallery(row) {
  if (!row) return null;
  return {
    id: row.id,
    image: row.image,
    caption: row.caption || '',
    category: row.category || 'dishes',
  };
}

function normalizeVideo(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    videoUrl: row.video_url || row.videoUrl || '',
    posterUrl: row.poster_url || row.posterUrl || '',
    category: row.category || '',
    duration: row.duration || '',
    description: row.description || '',
  };
}

function normalizeEnquiry(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    eventType: row.event_type || row.eventType || 'General Enquiry',
    date: row.date || '',
    guests: row.guests || '',
    message: row.message || '',
    status: row.status || 'new',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

// ----------------- Supabase Data Operations -----------------

async function testConnection() {
  if (!isConfigured()) {
    return { ok: false, message: 'SUPABASE_URL or SUPABASE_KEY not configured in .env' };
  }
  try {
    const sb = getClient();
    const { data, error } = await sb.from('settings').select('id').limit(1);
    if (error) {
      // Check if table missing error or permission error
      return { ok: false, error: error.message, details: error };
    }
    return { ok: true, message: 'Connected to Supabase successfully' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ---------- Dishes ----------
async function getDishes() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('dishes')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeDish);
}

async function saveDishes(dishes) {
  const sb = getClient();
  if (!sb) return false;
  // Format for DB
  const records = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    price: Number(d.price) || 0,
    unit: d.unit || 'per kg',
    spice: Number(d.spice) || 0,
    image: d.image || '',
    featured: Boolean(d.featured),
  }));

  // Sync with Supabase: upsert all records
  if (records.length > 0) {
    const { error: upsertErr } = await sb.from('dishes').upsert(records);
    if (upsertErr) throw upsertErr;

    // Remove any rows that are no longer in `dishes`
    const currentIds = dishes.map((d) => d.id);
    const { data: existing, error: fetchErr } = await sb.from('dishes').select('id');
    if (!fetchErr && existing) {
      const toDelete = existing.filter((e) => !currentIds.includes(e.id)).map((e) => e.id);
      if (toDelete.length > 0) {
        await sb.from('dishes').delete().in('id', toDelete);
      }
    }
  } else {
    await sb.from('dishes').delete().neq('id', '___non_existent___');
  }
  return true;
}

// ---------- Menus ----------
async function getMenus() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('menus').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeMenu);
}

async function saveMenus(menus) {
  const sb = getClient();
  if (!sb) return false;
  const records = menus.map((m) => ({
    id: m.id,
    title: m.title || '',
    name: m.name || '',
    type: m.type || '',
    badge: m.badge || '',
    image: m.image || '',
    items: Array.isArray(m.items) ? m.items : [],
  }));
  if (records.length > 0) {
    const { error } = await sb.from('menus').upsert(records);
    if (error) throw error;
  }
  return true;
}

// ---------- Gallery ----------
async function getGallery() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('gallery').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeGallery);
}

async function saveGallery(items) {
  const sb = getClient();
  if (!sb) return false;
  const records = items.map((g) => ({
    id: g.id,
    image: g.image,
    caption: g.caption || '',
    category: g.category || 'dishes',
  }));

  if (records.length > 0) {
    const { error: upsertErr } = await sb.from('gallery').upsert(records);
    if (upsertErr) throw upsertErr;

    // Delete removed items
    const currentIds = items.map((g) => g.id);
    const { data: existing, error: fetchErr } = await sb.from('gallery').select('id');
    if (!fetchErr && existing) {
      const toDelete = existing.filter((e) => !currentIds.includes(e.id)).map((e) => e.id);
      if (toDelete.length > 0) {
        await sb.from('gallery').delete().in('id', toDelete);
      }
    }
  } else {
    await sb.from('gallery').delete().neq('id', '___non_existent___');
  }
  return true;
}

// ---------- Videos ----------
async function getVideos() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('videos').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeVideo);
}

async function saveVideos(videos) {
  const sb = getClient();
  if (!sb) return false;
  const records = videos.map((v) => ({
    id: v.id,
    title: v.title || '',
    video_url: v.videoUrl || v.video_url || '',
    poster_url: v.posterUrl || v.poster_url || '',
    category: v.category || '',
    duration: v.duration || '',
    description: v.description || '',
  }));
  if (records.length > 0) {
    const { error } = await sb.from('videos').upsert(records);
    if (error) throw error;
  }
  return true;
}

// ---------- Enquiries ----------
async function getEnquiries() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeEnquiry);
}

async function saveEnquiries(enquiries) {
  const sb = getClient();
  if (!sb) return false;
  const records = enquiries.map((e) => ({
    id: e.id,
    name: e.name,
    phone: e.phone,
    event_type: e.eventType || e.event_type || '',
    date: e.date || '',
    guests: String(e.guests || ''),
    message: e.message || '',
    status: e.status || 'new',
    created_at: e.createdAt || e.created_at || new Date().toISOString(),
  }));

  if (records.length > 0) {
    const { error: upsertErr } = await sb.from('enquiries').upsert(records);
    if (upsertErr) throw upsertErr;

    const currentIds = enquiries.map((e) => e.id);
    const { data: existing, error: fetchErr } = await sb.from('enquiries').select('id');
    if (!fetchErr && existing) {
      const toDelete = existing.filter((e) => !currentIds.includes(e.id)).map((e) => e.id);
      if (toDelete.length > 0) {
        await sb.from('enquiries').delete().in('id', toDelete);
      }
    }
  } else {
    await sb.from('enquiries').delete().neq('id', '___non_existent___');
  }
  return true;
}

async function insertEnquiry(enquiry) {
  const sb = getClient();
  if (!sb) return null;
  const record = {
    id: enquiry.id,
    name: enquiry.name,
    phone: enquiry.phone,
    event_type: enquiry.eventType || enquiry.event_type || 'General Enquiry',
    date: enquiry.date || '',
    guests: String(enquiry.guests || ''),
    message: enquiry.message || '',
    status: enquiry.status || 'new',
    created_at: enquiry.createdAt || enquiry.created_at || new Date().toISOString(),
  };
  const { data, error } = await sb.from('enquiries').insert([record]).select();
  if (error) throw error;
  return normalizeEnquiry(data ? data[0] : record);
}

// ---------- Settings ----------
async function getSettings() {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from('settings').select('data').eq('id', 'current').single();
  if (error) {
    // If no row exists yet, return null
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? data.data : null;
}

async function saveSettings(settings) {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb
    .from('settings')
    .upsert({ id: 'current', data: settings, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}

// ---------- Admin Users ----------
async function getAdminCount() {
  const sb = getClient();
  if (!sb) return 0;
  try {
    const { count, error } = await sb.from('admin_users').select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  } catch (e) {
    return 0;
  }
}

async function findAdminUser(identifier) {
  const sb = getClient();
  if (!sb || !identifier) return null;
  const clean = identifier.trim().toLowerCase();

  // Search by username
  let { data, error } = await sb.from('admin_users').select('*').ilike('username', clean).limit(1);
  if (!error && data && data.length > 0) return data[0];

  // Search by email
  const res = await sb.from('admin_users').select('*').ilike('email', clean).limit(1);
  if (!res.error && res.data && res.data.length > 0) return res.data[0];

  return null;
}

async function getAdminUserById(id) {
  const sb = getClient();
  if (!sb || !id) return null;
  const { data, error } = await sb.from('admin_users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
}

async function createAdminUser({ id, username, email, password_hash, role = 'admin' }) {
  const sb = getClient();
  if (!sb) return null;
  const record = {
    id: id || `admin_${Date.now().toString(36)}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from('admin_users').insert([record]).select();
  if (error) throw error;
  return data ? data[0] : record;
}

async function updateAdminPassword(userId, password_hash) {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb
    .from('admin_users')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
  return true;
}

// ---------- Admin OTPs ----------
async function createOtp({ user_id, otp_code, purpose = 'password_reset', minutesValid = 10 }) {
  const sb = getClient();
  if (!sb) return null;
  const expires_at = new Date(Date.now() + minutesValid * 60 * 1000).toISOString();
  const record = {
    id: `otp_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
    user_id,
    otp_code: String(otp_code),
    purpose,
    expires_at,
    used: false,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from('admin_otps').insert([record]).select();
  if (error) throw error;
  return data ? data[0] : record;
}

async function verifyAndConsumeOtp(userId, otp_code) {
  const sb = getClient();
  if (!sb) return { valid: false, error: 'Database not connected.' };

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('admin_otps')
    .select('*')
    .eq('user_id', userId)
    .eq('otp_code', String(otp_code).trim())
    .eq('used', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return { valid: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { valid: false, error: 'Invalid or expired OTP code. Please request a new one.' };
  }

  const otpRecord = data[0];
  // Mark as used
  await sb.from('admin_otps').update({ used: true }).eq('id', otpRecord.id);

  return { valid: true, otp: otpRecord };
}

module.exports = {
  isConfigured,
  getClient,
  testConnection,
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
  insertEnquiry,
  getSettings,
  saveSettings,
  getAdminCount,
  findAdminUser,
  getAdminUserById,
  createAdminUser,
  updateAdminPassword,
  createOtp,
  verifyAndConsumeOtp,
};
