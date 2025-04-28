const express = require('express')
const router = express.Router()
const progressController = require('../controllers/ProgressController')
const { checkLogin } = require('../middlewares/authMiddleware');

router.get('/', checkLogin,
    progressController.getProgress)

module.exports = router