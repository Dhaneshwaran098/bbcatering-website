// =========================================================
// Minimal EJS-compatible template engine using only Node's
// built-in modules. Supports the subset of EJS syntax this
// project actually uses:
//   <%= expr %>   output, HTML-escaped
//   <%- expr %>   output, raw (unescaped)
//   <%  code %>   scriptlet (if/for/forEach etc.)
//   <%# comment %> ignored
//   include('relative/path', { extra: locals })
// =========================================================
const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function compileToSource(template) {
  let src = 'let __out = [];\n';
  src += 'with (__locals) {\n';
  let cursor = 0;
  const re = /<%([-=#]?)([\s\S]*?)%>/g;
  let m;
  while ((m = re.exec(template))) {
    const text = template.slice(cursor, m.index);
    if (text) src += `__out.push(${JSON.stringify(text)});\n`;
    const [, type, code] = m;
    if (type === '#') {
      // comment — emit nothing
    } else if (type === '=') {
      src += `__out.push(__escape((${code.trim()})));\n`;
    } else if (type === '-') {
      src += `__out.push(String((${code.trim()}) ?? ''));\n`;
    } else {
      src += code + '\n';
    }
    cursor = re.lastIndex;
  }
  const tail = template.slice(cursor);
  if (tail) src += `__out.push(${JSON.stringify(tail)});\n`;
  src += '}\nreturn __out.join("");\n';
  return src;
}

// Cache compiled template functions by absolute file path (dev-friendly:
// cache is keyed by content hash-free mtime check would add complexity we
// don't need for a small site, so we simply re-read+recompile each render.
// This keeps admin edits to views reflected instantly with no restart.)
function renderFile(viewsDir, relPath, locals) {
  const filePath = path.join(viewsDir, relPath.endsWith('.ejs') ? relPath : `${relPath}.ejs`);
  const template = fs.readFileSync(filePath, 'utf-8');
  const src = compileToSource(template);

  const includeFn = (incPath, incLocals) => {
    const merged = Object.assign({}, locals, incLocals || {});
    const incRel = path.join(path.dirname(relPath), incPath);
    return renderFile(viewsDir, incRel, merged);
  };

  const scopedLocals = Object.assign({}, locals, {
    include: includeFn,
  });

  // eslint-disable-next-line no-new-func
  const fn = new Function('__locals', '__escape', src);
  return fn(scopedLocals, escapeHtml);
}

module.exports = { renderFile, escapeHtml };
