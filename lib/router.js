// =========================================================
// Minimal Express-Router-compatible router (subset used by
// this project): .get/.post with ':param' segments, plus a
// router-level .use(middleware) for auth-style guards.
// =========================================================
function pathToMatcher(routePath) {
  const paramNames = [];
  const pattern = routePath
    .replace(/\/:[a-zA-Z_]+/g, (match) => {
      paramNames.push(match.slice(2));
      return '/([^/]+)';
    });
  const regex = new RegExp(`^${pattern}$`);
  return { regex, paramNames };
}

class Router {
  constructor() {
    this.routes = []; // { method, matcher, handlers: [fn,...] }
    this.middlewares = []; // router-level .use() middlewares, run before every route
  }

  use(fn) {
    this.middlewares.push(fn);
  }

  _register(method, routePath, handlers) {
    this.routes.push({ method, matcher: pathToMatcher(routePath), handlers });
  }

  get(routePath, ...handlers) { this._register('GET', routePath, handlers); }
  post(routePath, ...handlers) { this._register('POST', routePath, handlers); }

  // Attempts to handle (method, subPath). Returns true if a route matched
  // (and was fully handled), false if nothing matched so the caller can
  // try the next mounted router / fall through to a 404.
  handle(method, subPath, req, res) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const m = route.matcher.regex.exec(subPath);
      if (!m) continue;
      route.matcher.paramNames.forEach((name, i) => {
        req.params[name] = decodeURIComponent(m[i + 1]);
      });
      const chain = [...this.middlewares, ...route.handlers];
      runChain(chain, req, res);
      return true;
    }
    return false;
  }
}

function runChain(chain, req, res) {
  let i = 0;
  function next(err) {
    if (err) {
      console.error(err);
      res.status(500).send(`
        <div style="font-family:sans-serif;padding:60px;max-width:600px;">
          <h1>Something went wrong</h1>
          <p>${err.message || 'Unexpected server error.'}</p>
          <a href="/">&larr; Go back</a>
        </div>
      `);
      return;
    }
    const fn = chain[i++];
    if (!fn) return; // chain exhausted with no response — handler forgot to respond
    try {
      const maybePromise = fn(req, res, next);
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(next);
      }
    } catch (e) {
      next(e);
    }
  }
  next();
}

module.exports = { Router };
