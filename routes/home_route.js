const express = require('express')
const router = express.Router()
const homeController = require('../controllers/homeController')
const { isUser } = require('../middlewares/authMiddleware')

router.get("/",isUser, homeController.index)

module.exports = router