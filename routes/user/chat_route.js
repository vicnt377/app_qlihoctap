const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/user/ChatController');
const { isUser } = require('../../middlewares/userCheck')

router.get('/', isUser, chatController.index);

module.exports = router;
