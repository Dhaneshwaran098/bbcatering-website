// =========================================================
// Simple JSON-file data store.
// No database server needed — good fit for a small catering
// site's content volume (a few dozen dishes/photos). Each
// write is atomic (write to temp file, then rename) so a
// crash mid-write can't corrupt the data file.
// =========================================================
const fs = require('fs');
const path = require('path');

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
    throw err;
  }
}

function writeJSON(name, data) {
  const target = filePath(name);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, target);
}

function generateId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

// ---------- Dishes ----------
function getDishes() {
  return readJSON('dishes', []);
}
function saveDishes(dishes) {
  writeJSON('dishes', dishes);
}

// ---------- Gallery ----------
function getGallery() {
  return readJSON('gallery', []);
}
function saveGallery(items) {
  writeJSON('gallery', items);
}

// ---------- Settings ----------
function getSettings() {
  return readJSON('settings', {});
}
function saveSettings(settings) {
  writeJSON('settings', settings);
}

module.exports = {
  getDishes, saveDishes,
  getGallery, saveGallery,
  getSettings, saveSettings,
  generateId,
};
