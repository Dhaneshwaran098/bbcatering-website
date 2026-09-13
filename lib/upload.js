// =========================================================
// Minimal multipart/form-data parser (replaces 'multer').
// Parses raw request body bytes into text fields + files.
// Good enough for a small admin form: a handful of text
// fields plus at most one file input per request.
// =========================================================
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB total request body safety cap

class UploadError extends Error {}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_SIZE) {
        reject(new UploadError('Upload too large. Please use a smaller file.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  while (true) {
    const idx = buffer.indexOf(delimiter, start);
    if (idx === -1) {
      parts.push(buffer.slice(start));
      break;
    }
    parts.push(buffer.slice(start, idx));
    start = idx + delimiter.length;
  }
  return parts;
}

function parseHeaders(headerBlock) {
  const headers = {};
  headerBlock.toString('utf-8').split('\r\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  });
  return headers;
}

// Parses a raw multipart body Buffer given the boundary string (without
// leading --). Returns { fields: {name: value}, files: {name: {filename, mimetype, buffer}} }
function parseMultipart(bodyBuffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const rawParts = splitBuffer(bodyBuffer, delimiter);

  const fields = {};
  const files = {};

  for (let part of rawParts) {
    // Strip leading CRLF and trailing CRLF / trailing "--" (final boundary)
    if (part.length === 0) continue;
    if (part.slice(0, 2).toString() === '--') continue; // final boundary marker
    if (part.slice(0, 2).toString('binary') === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString('binary') === '\r\n') part = part.slice(0, -2);
    if (part.length === 0) continue;

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = parseHeaders(part.slice(0, headerEnd));
    const content = part.slice(headerEnd + 4);

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]*)"/);
    const filenameMatch = disposition.match(/filename="([^"]*)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    if (filenameMatch && filenameMatch[1]) {
      files[fieldName] = {
        filename: filenameMatch[1],
        mimetype: headers['content-type'] || 'application/octet-stream',
        buffer: content,
      };
    } else {
      fields[fieldName] = content.toString('utf-8');
    }
  }

  return { fields, files };
}

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function saveFileToDisk(file) {
  const ext = (path.extname(file.filename) || '.jpg').toLowerCase();
  const unique = crypto.randomBytes(8).toString('hex');
  const savedName = `img-${Date.now()}-${unique}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, savedName), file.buffer);
  return savedName;
}

function validateAndSave(file) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw new UploadError('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.');
  }
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new UploadError('Image is too large — please use a file under 6MB.');
  }
  const savedName = saveFileToDisk(file);
  return { filename: savedName, mimetype: file.mimetype, size: file.buffer.length };
}

// Express/Multer-style middleware factory: upload.single('fieldName')
// Parses the body (if multipart), validates the named file (if present),
// saves it to disk, and sets req.body + req.file to match the API the
// rest of the app already expects.
function single(fieldName) {
  return async function uploadSingleMiddleware(req, res, next) {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.startsWith('multipart/form-data')) {
      // No file upload on this request — just make sure req.body exists.
      req.body = req.body || {};
      return next();
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) return next(new UploadError('Malformed upload request (no boundary).'));
    const boundary = boundaryMatch[1] || boundaryMatch[2];

    let raw;
    try {
      raw = await readRawBody(req);
    } catch (err) {
      return next(err);
    }

    const { fields, files } = parseMultipart(raw, boundary);
    req.body = fields;

    const file = files[fieldName];
    if (file && file.filename) {
      try {
        req.file = validateAndSave(file);
      } catch (err) {
        return next(err);
      }
    }

    next();
  };
}

// upload.fields(['heroImage', 'logoImage', ...]) — same idea as single(),
// but saves any/all of several named file inputs from one form submission
// (e.g. the Settings page, which can update hero photo, logo, and favicon
// together). Sets req.files = { fieldName: {filename, mimetype, size} }.
function fields(fieldNames) {
  return async function uploadFieldsMiddleware(req, res, next) {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.startsWith('multipart/form-data')) {
      req.body = req.body || {};
      req.files = req.files || {};
      return next();
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) return next(new UploadError('Malformed upload request (no boundary).'));
    const boundary = boundaryMatch[1] || boundaryMatch[2];

    let raw;
    try {
      raw = await readRawBody(req);
    } catch (err) {
      return next(err);
    }

    const { fields: parsedFields, files } = parseMultipart(raw, boundary);
    req.body = parsedFields;
    req.files = {};

    try {
      for (const name of fieldNames) {
        const file = files[name];
        if (file && file.filename) {
          req.files[name] = validateAndSave(file);
        }
      }
    } catch (err) {
      return next(err);
    }

    next();
  };
}

module.exports = { single, fields, UploadError };
