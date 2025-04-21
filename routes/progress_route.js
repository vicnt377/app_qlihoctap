const express = require('express')
const router = express.Router()
const progressController = require('../controllers/ProgressController')

router.get('/', progressController.getProgress)

module.exports = router