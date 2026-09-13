// =========================================================
// Minimal .env loader (replaces the 'dotenv' package).
// Reads KEY=VALUE lines from a .env file into process.env,
// skipping blank lines and lines starting with '#'.
// Silently does nothing if no .env file exists.
// =========================================================
const fs = require('fs');
const path = require('path');

function loadEnv(envPath = path.join(__dirname, '..', '.env')) {
  let content;
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch (err) {
    return; // no .env file — that's fine, caller can set env vars another way
  }

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // strip matching surrounding quotes, if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

module.exports = { loadEnv };
