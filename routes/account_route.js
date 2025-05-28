const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountController')
const upload = require('../middlewares/updateMiddleware');

router.get('/', accountController.index);
router.post('/update', upload.single('avatar'), accountController.updateProfile);

module.exports = router