const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/admin/ChatAdminController');
const { isAdmin } = require('../../middlewares/adminCheck');

// CHAT
router.get('/chat', isAdmin, chatController.inbox);
router.get('/chat/messages/:userId', isAdmin, chatController.getMessages);
router.post('/chat/mark-read/:userId', isAdmin, chatController.markRead);

module.exports = router;
