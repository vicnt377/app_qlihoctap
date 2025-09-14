const express = require('express')
const router = express.Router()
const scoreController = require('../../controllers/user/ScoreController')
const { isUser } = require('../../middlewares/userCheck')

router.get('/',isUser, scoreController.getScore)
router.post('/update',isUser, scoreController.updateScore)



module.exports = router