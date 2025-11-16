const User = require('../../models/User');
const Admin = require('../../models/Admin');
const Video = require('../../models/Video');

class DashboardController {
  async dashboard(req, res) {
    try {

      const [
        totalUsers,
        totalAdmins,
        totalVideos,
        deletedVideos
      ] = await Promise.all([
        User.countDocuments({ role: 'user' }),     // user thường
        User.countDocuments({ role: 'admin' }),    // đếm admin đúng
        Video.countDocuments({}),
        Video.countDocuments({ daXoa: true })
      ]);

      const recentUsers = await User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const recentVideos = await Video.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      res.render('admin/dashboard', {
        layout: 'admin',
        user: req.session.admin,
        stats: {
          totalUsers,
          totalAdmins,
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
