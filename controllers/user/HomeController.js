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

      const scores = await Score.find({ user: userId }).populate('HocPhan').lean();

      let totalCredits = 0;
      const maxCredits = user?.totalCredits
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
      const videos = await Video.find({ category: user.major, daXoa: false }).lean();

      // 🔥 Lấy tài liệu public trong 3 ngày gần nhất
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentDocs = await Document.find({
        visibility: 'public',
        createdAt: { $gte: threeDaysAgo }
      })
        .populate('user', 'user')
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
        maxCredits,
        monNo,
        totalCreditsExceeded,
        totalNoSubjects,
        videos,
        videoCount: videos.length,
        recentDocs,
        recentDocsCount,
        showCongrats: req.session.showCongrats,
        congratsMessage: req.session.congratsMessage,
        enrolledVideos: populatedUser.enrolledVideos || []

      });
      req.session.showCongrats = null;
      req.session.congratsMessage = null;
      
    } catch (error) {
      console.error("Lỗi trang chủ:", error);
      next(error);
    }
  }
}

module.exports = new HomeController();
