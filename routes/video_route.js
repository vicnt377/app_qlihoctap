const express = require('express')
const router = express.Router()
const videoController = require('../controllers/VideoController')
const { isUser } = require('../middlewares/authMiddleware')

router.get('/', isUser, videoController.getVideo)





module.exports = router