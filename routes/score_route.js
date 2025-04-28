const express = require('express')
const router = express.Router()
const scoreController = require('../controllers/ScoreController')

router.get('/', scoreController.getScore)
router.post('/update', scoreController.updateScore)



module.exports = router