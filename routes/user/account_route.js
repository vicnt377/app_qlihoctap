const express = require('express')
const router = express.Router()
const accountController = require('../../controllers/user/AccountController')
const upload = require('../../middlewares/updateImage')
const { isUser } = require('../../middlewares/userCheck');

router.get('/', isUser, accountController.index);
router.post('/update-profile',isUser, upload.single('avatar'), accountController.updateProfile);
router.post('/update-password',isUser, upload.single('avatar'), accountController.updatePassword);



module.exports = router