const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/DashboardController');
const { isAdmin } = require('../../middlewares/adminCheck');

router.get('/dashboard', isAdmin, dashboardController.dashboard);

module.exports = router;
