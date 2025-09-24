const User = require('../../models/User');
const Score = require('../../models/Score');
const Video = require('../../models/Video');
const Document = require('../../models/Document');

class HomeController {
  async index(req, res, next) {
    try {
      const userId = req.session.userId || req.session?.user?._id;

      if (!userId) {
        return res.redirect('/login-user');
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        return res.redirect('/login-user');
      }

      const scores = await Score.find({ username: userId }).populate('HocPhan').lean();

      let totalCredits = 0;
      const maxCredits = 152;
      let monNo = [];

      scores.forEach(score => {
        if (score.HocPhan) {
          totalCredits += score.HocPhan.soTinChi;

          if (score.diemChu && score.diemChu.toUpperCase() === 'F') {
            monNo.push(score);
          }
        }
      });

      const totalNoSubjects = monNo.length;
      const totalCreditsExceeded = totalCredits > maxCredits;

      const populatedUser = await User.findById(userId)
        .populate('enrolledVideos')
        .lean();
      const enrolledVideos = populatedUser?.enrolledVideos || [];

      // 🔥 Lấy tài liệu public trong 3 ngày gần nhất
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentDocs = await Document.find({
        visibility: 'public',
        createdAt: { $gte: threeDaysAgo }
      })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(6) // tối đa 6 tài liệu
        .lean();

      const recentDocsCount = await Document.countDocuments({
        visibility: 'public',
        createdAt: { $gte: threeDaysAgo }
      });

      res.render('user/home', {
        user,
        totalCredits,
        monNo,
        totalCreditsExceeded,
        totalNoSubjects,
        enrolledVideos,
        recentDocs,
        recentDocsCount
      });
    } catch (error) {
      console.error("Lỗi trang chủ:", error);
      next(error);
    }
  }
}

module.exports = new HomeController();
