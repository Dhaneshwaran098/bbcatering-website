const { loadEnv } = require('./lib/dotenv');
loadEnv();

const http = require('http');
const url = require('url');
const path = require('path');

const { parseCookies, serializeCookie } = require('./lib/cookies');
const { sessionMiddleware } = require('./lib/session');
const { urlencodedMiddleware } = require('./lib/bodyParser');
const { serveStatic } = require('./lib/static');
const { renderFile } = require('./lib/template');

const siteRoutes = require('./routes/site');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const PORT = process.env.PORT || 3000;
const VIEWS_DIR = path.join(__dirname, 'views');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!process.env.SESSION_SECRET) {
  console.warn('\n\u26a0\ufe0f  SESSION_SECRET is not set in .env \u2014 sessions will still work, but set one before deploying.\n');
}
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn('\n\u26a0\ufe0f  ADMIN_PASSWORD_HASH is not set in .env \u2014 admin login will not work.');
  console.warn('   Run: node scripts/hash-password.js "yourChosenPassword"');
  console.warn('   Then copy the printed line into your .env file.\n');
}

const staticMiddleware = serveStatic(PUBLIC_DIR);

function augmentResponse(res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };

  res.send = function send(body) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    res.end(body);
  };

  res.json = function json(obj) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
  };

  res.redirect = function redirect(target) {
    res.statusCode = 302;
    res.setHeader('Location', target);
    res.end();
  };

  res.render = function render(view, locals) {
    locals = locals || {};
    if (!locals.settings) {
      try {
        locals.settings = require('./lib/store').getSettings();
      } catch (e) {
        locals.settings = {};
      }
    }
    try {
      const html = renderFile(VIEWS_DIR, view, locals);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (err) {
      console.error('Render error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<pre style="padding:40px;font-family:monospace;white-space:pre-wrap;">Template error: ' + err.message + '\n\n' + (err.stack || '') + '</pre>');
    }
  };

  const cookiesToSet = [];
  res.setCookie = function setCookie(name, value, opts) {
    cookiesToSet.push(serializeCookie(name, value, opts));
    res.setHeader('Set-Cookie', cookiesToSet);
  };
}

function augmentRequest(req) {
  const parsed = url.parse(req.url, true);
  req.pathname = decodeURIComponent(parsed.pathname);
  req.query = parsed.query;
  req.originalUrl = req.url;
  req.cookies = parseCookies(req.headers.cookie);
  req.params = {};
  req.ip = req.socket.remoteAddress || '';
}

function stripPrefix(pathname, prefix) {
  if (pathname === prefix) return '/';
  if (pathname.indexOf(prefix + '/') === 0) return pathname.slice(prefix.length) || '/';
  return null;
}

function notFound(req, res) {
  res.status(404).send('<h1 style="font-family:sans-serif;padding:60px;">404 \u2014 Page not found</h1><p style="font-family:sans-serif;padding:0 60px;"><a href="/">Back to home</a></p>');
}

function runMiddlewareChain(middlewares, req, res, done) {
  let i = 0;
  function next(err) {
    if (err) return done(err);
    const fn = middlewares[i++];
    if (!fn) return done();
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  }
  next();
}

const server = http.createServer((req, res) => {
  augmentRequest(req);
  augmentResponse(res);

  const globalMiddlewares = [staticMiddleware, sessionMiddleware, urlencodedMiddleware];

  runMiddlewareChain(globalMiddlewares, req, res, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(
        '<div style="font-family:sans-serif;padding:60px;max-width:600px;">' +
        '<h1>Something went wrong</h1><p>' + (err.message || 'Unexpected server error.') + '</p>' +
        '<a href="/">&larr; Go back</a></div>'
      );
      return;
    }

    if (res.writableEnded) return;

    const pathname = req.pathname;

    const adminSubPath = stripPrefix(pathname, '/admin');
    if (adminSubPath !== null) {
      req.params = {};
      if (authRoutes.handle(req.method, adminSubPath, req, res)) return;
      req.params = {};
      if (adminRoutes.handle(req.method, adminSubPath, req, res)) return;
      return notFound(req, res);
    }

    req.params = {};
    if (siteRoutes.handle(req.method, pathname, req, res)) return;

    return notFound(req, res);
  });
});

function startServer(portToTry) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = Number(portToTry) + 1;
      console.warn(`\n⚠️  Port ${portToTry} is already in use. Retrying on port ${fallbackPort}...`);
      startServer(fallbackPort);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(portToTry, () => {
    let bizName = 'Catering site';
    try {
      bizName = require('./lib/store').getSettings().businessName || bizName;
    } catch (e) { /* settings fallback */ }
    console.log('\n🍛  ' + bizName + ' server running at http://localhost:' + portToTry);
    console.log('    Admin login: http://localhost:' + portToTry + '/admin/login\n');
  });
}

startServer(PORT);

module.exports = server;
