const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

class DashboardController {
        async dashboard(req, res) {
        try {
            const [totalUsers, adminUsers, totalVideos, deletedVideos] = await Promise.all([
                User.countDocuments({ role: 'user'}),
                User.countDocuments({ role: 'admin' }),
                Video.countDocuments({}),
                Video.countDocuments({ daXoa: true })
            ]);

            const recentUsers = await User.find({role: 'user'})
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            const recentVideos = await Video.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            res.render('admin/dashboard', {
                user: req.session.user,
                layout: 'admin',
                stats: {
                    totalUsers,
                    adminUsers,
                    totalVideos,
                    deletedVideos
                },
                recentUsers,
                recentVideos
            });

        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Lỗi khi tải dashboard');
            res.redirect('/admin/login-admin');
        }
    }
}
module.exports = new DashboardController();