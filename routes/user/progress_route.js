const express = require('express')
const router = express.Router()
const progressController = require('../../controllers/user/ProgressController')
const { isUser } = require('../../middlewares/authMiddleware');

router.get('/', isUser, progressController.getProgress)

module.exports = router