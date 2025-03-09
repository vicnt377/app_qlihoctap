const express = require('express')
const router = express.Router()
const scoreController = require('../controllers/ScoreController')

router.get('/score', scoreController.index)

module.exports = router