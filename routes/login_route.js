const express = require('express')
const router = express.Router()
const loginController = require('../controllers/LoginController')

router.get('/', loginController.index)
router.post('/', loginController.login)

router.get('/logout', loginController.logout)

router.get('/reset-password', loginController.showResetPassword)
router.post('/reset-password', loginController.updatePassword);

module.exports = router