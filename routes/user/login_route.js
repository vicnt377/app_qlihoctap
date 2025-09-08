const express = require('express')
const router = express.Router()
const loginController = require('../../controllers/user/LoginController')

router.get('/', loginController.re_login)
router.get('/login-user', loginController.login_user)
router.post('/login-user', loginController.login)

router.get('/logout', loginController.logout)
router.post('/logout', loginController.logout)

router.get('/reset-password', loginController.showResetPassword)
router.post('/reset-password', loginController.updatePassword);



module.exports = router