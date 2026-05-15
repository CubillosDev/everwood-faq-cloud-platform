const express = require('express');
const router = express.Router();
const { listFaqs, patchFaq } = require('../controllers/faqController');

// GET /api/faqs?status=pendiente
router.get('/', listFaqs);

// PATCH /api/faqs/:id
router.patch('/:id', patchFaq);

module.exports = router;
