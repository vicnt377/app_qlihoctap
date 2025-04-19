const express = require('express')
const router = express.Router()
const scoreController = require('../controllers/ScoreController')

router.get('/score', scoreController.getScore)

module.exports = router