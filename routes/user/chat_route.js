const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/user/ChatController');
const { isUser } = require('../../middlewares/authMiddleware')

router.get('/', isUser, chatController.index);
router.post('/send',isUser, chatController.sendMessage);

module.exports = router;
