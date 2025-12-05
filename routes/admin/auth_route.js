const express = require('express');
const router = express.Router();
const loginAdminController = require('../../controllers/admin/LoginAdminController');

// Login admin
router.get('/', loginAdminController.login_admin);
router.get('/login-admin', loginAdminController.login_admin);
router.post('/login-admin', loginAdminController.login);

module.exports = router;
