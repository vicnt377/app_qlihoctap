const User = require('../../models/User');
const Video = require('../../models/Video');

class DashboardController {
  async dashboard(req, res) {
    try {
      // ================= BASIC DASHBOARD =================
      const [
        totalUsers,
        totalAdmins,
        totalVideos,
        deletedVideos
      ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'admin' }),
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

      // ================= STATISTICS =================

      // Tổng lượt đăng ký
      const totalRegisters = await User.aggregate([
        { $match: { role: "user" }},
        { $unwind: "$enrolledVideos" },
        { $count: "total" }
      ]).then(r => r[0]?.total || 0);

      // Video hoàn thành
      const completedVideos = await Video.countDocuments({
        reviews: { $exists: true, $not: { $size: 0 } }
      });

      const averageProgress = totalVideos > 0
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

      // Growth by month
      const growth = await User.aggregate([
        { $match: { role: "user" }},
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: 1 }
          }
        }
      ]);

      const growthMonths = Array.from({ length: 12 }, (_, i) => ({
        label: `T${i + 1}`,
        value: growth.find(m => m._id === i + 1)?.total || 0
      }));

      const growthLabels = growthMonths.map(m => m.label);
      const growthValues = growthMonths.map(m => m.value);

      // Thống kê chuyên ngành
      const majorStats = await User.aggregate([
        { $match: { role: "user" }},
        {
          $group: {
            _id: "$major",
            total: { $sum: 1 }
          }
        }
      ]);

      const majorLabels = majorStats.map(m => m._id || "Không xác định");
      const majorValues = majorStats.map(m => m.total);

      // ================= RENDER =================
      res.render('admin/dashboard', {
        layout: 'admin',
        user: req.session.admin,

        stats: {
          totalUsers,
          totalAdmins,
          totalVideos,
          deletedVideos,
        },

        // Thống kê nâng cao (từ statistic.hbs)
        totalRegisters,
        completedVideos,
        averageProgress,
        growthLabels,
        growthValues,
        majorLabels,
        majorValues,

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
