// =========================================================
// Parses application/x-www-form-urlencoded request bodies.
// Uses Node's built-in querystring module — no dependency.
// Multipart bodies (file uploads) are handled separately by
// lib/upload.js, which sets req.body itself when it runs.
// =========================================================
const querystring = require('querystring');

function readRawBody(req, maxSize = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxSize) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function urlencodedMiddleware(req, res, next) {
  const contentType = req.headers['content-type'] || '';

  if (req.method !== 'POST' || !contentType.startsWith('application/x-www-form-urlencoded')) {
    return next();
  }

  try {
    const raw = await readRawBody(req);
    req.body = querystring.parse(raw.toString('utf-8'));
  } catch (err) {
    return next(err);
  }
  next();
}

module.exports = { urlencodedMiddleware };
