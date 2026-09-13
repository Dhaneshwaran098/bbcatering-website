// Thin re-export so existing code (`require('../middleware/upload')`)
// keeps working unchanged after swapping the implementation from
// Multer to our own zero-dependency multipart parser in lib/upload.js.
module.exports = require('../lib/upload');
