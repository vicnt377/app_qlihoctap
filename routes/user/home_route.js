const express = require('express')
const router = express.Router()
const homeController = require('../../controllers/user/HomeController')
const { isUser } = require('../../middlewares/authMiddleware')

router.get("/",isUser, homeController.index)

module.exports = router