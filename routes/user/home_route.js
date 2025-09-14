const express = require('express')
const router = express.Router()
const homeController = require('../../controllers/user/HomeController')
const { isUser } = require('../../middlewares/userCheck')

router.get("/",isUser, homeController.index)

module.exports = router