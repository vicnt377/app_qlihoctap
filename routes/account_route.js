const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountController')
const upload = require('../middlewares/updateMiddleware')
const { isUser } = require('../middlewares/authMiddleware');

router.get('/', isUser, accountController.index);
router.post('/update',isUser, upload.single('avatar'), accountController.updateProfile);

module.exports = router