const express = require('express');
const router = express.Router();
const upload = require('../middlewares/validateFile');
const { handleUpload } = require('../controllers/uploadController');

// POST /api/upload
// multer procesa el archivo antes de que llegue al controller
router.post('/', upload.single('file'), handleUpload);

module.exports = router;
