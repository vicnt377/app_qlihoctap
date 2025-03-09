const express = require('express')
const router = express.Router()
const loginController = require('../controllers/LoginController')

router.get('/login', loginController.index)

module.exports = router