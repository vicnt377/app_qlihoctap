const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountController')
const upload = require('../middlewares/updateMiddleware')
const { isUser } = require('../middlewares/authMiddleware');

router.get('/', isUser, accountController.index);
router.post('/update-profile',isUser, upload.single('avatar'), accountController.updateProfile);
router.post('/update-password',isUser, upload.single('avatar'), accountController.updatePassword);

module.exports = router