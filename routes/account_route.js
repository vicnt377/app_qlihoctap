const express = require('express')
const router = express.Router()
const accountController = require('../controllers/AccountController')

router.get('/', accountController.index);
router.post('/update', accountController.updateProfile);

module.exports = router