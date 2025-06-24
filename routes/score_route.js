const express = require('express')
const router = express.Router()
const scoreController = require('../controllers/ScoreController')
const { isUser } = require('../middlewares/authMiddleware')

router.get('/',isUser, scoreController.getScore)
router.post('/update',isUser, scoreController.updateScore)



module.exports = router