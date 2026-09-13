// =========================================================
// Minimal static file server (replaces express.static).
// Serves files under public/ by exact path match, with basic
// content-type detection and path-traversal protection.
// =========================================================
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(publicDir) {
  const resolvedPublicDir = path.resolve(publicDir);

  return function staticMiddleware(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const urlPath = decodeURIComponent(req.pathname);
    const filePath = path.resolve(path.join(resolvedPublicDir, urlPath));

    // Path traversal guard: resolved path must stay within publicDir
    if (!filePath.startsWith(resolvedPublicDir)) {
      return next();
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) return next();

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      });

      if (req.method === 'HEAD') return res.end();

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => { res.end(); });
    });
  };
}

module.exports = { serveStatic };
