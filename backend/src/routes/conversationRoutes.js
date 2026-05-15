const express = require('express');
const router = express.Router();
const {
  listConversations,
  getConversation,
  patchStatus,
} = require('../controllers/conversationController');

// GET /api/conversations
router.get('/', listConversations);

// GET /api/conversations/:id
router.get('/:id', getConversation);

// PATCH /api/conversations/:id/status
router.patch('/:id/status', patchStatus);

module.exports = router;
