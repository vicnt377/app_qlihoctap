const express = require('express');
const router = express.Router();
const loginController = require('../../controllers/admin/LoginController');

// Login admin
router.get('/', loginController.login_admin);
router.get('/login-admin', loginController.login_admin);
router.post('/login-admin', loginController.login);

module.exports = router;
