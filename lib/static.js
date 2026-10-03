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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
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

      // Support Range requests (essential for HTML5 video seeking)
      const range = req.headers && req.headers.range;
      if (range && stats.size) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

        if (isNaN(start) || start >= stats.size || end >= stats.size || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
          return res.end();
        }

        const chunksize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });

        if (req.method === 'HEAD') return res.end();

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
        stream.on('error', () => { res.end(); });
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Accept-Ranges': 'bytes',
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
