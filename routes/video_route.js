const express = require('express')
const router = express.Router()
const videoController = require('../controllers/VideoController')

router.get('/', videoController.getVideo)





module.exports = router