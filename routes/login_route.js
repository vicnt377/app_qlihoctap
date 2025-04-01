const express = require('express')
const router = express.Router()
const loginController = require('../controllers/LoginController')

router.get('/login', loginController.index)
router.post('/login', loginController.login)

router.get('/logout', loginController.logout)

router.get('/reset-password', loginController.showResetPassword)
router.post('/reset-password', loginController.updatePassword);

module.exports = router