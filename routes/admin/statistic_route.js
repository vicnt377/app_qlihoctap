const express = require('express');
const router = express.Router();
const statisticController = require('../../controllers/admin/StatisticController');
const { isAdmin } = require('../../middlewares/adminCheck');


router.get('/statistic', isAdmin, statisticController.statistic);
router.get('/statistic/export-pdf', statisticController.exportPDF);

module.exports = router;
