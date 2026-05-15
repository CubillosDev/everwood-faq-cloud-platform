const multer = require('multer');

const ALLOWED_TYPES = ['text/csv', 'application/json', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.csv', '.json', '.txt'];
const MAX_SIZE_MB = 5;

// Multer en memoria (no guarda en disco, sube directo a Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error(`Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`);
      err.status = 400;
      cb(err, false);
    }
  },
});

module.exports = upload;
