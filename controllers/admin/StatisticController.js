const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

class StatisticController {
    statistic(req, res) {
        res.render('admin/statistic', {layout: "admin", error: null });
    }
}
module.exports = new StatisticController();