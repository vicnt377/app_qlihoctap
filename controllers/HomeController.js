const User = require('../models/User');
const Score = require('../models/Score');
const Video = require('../models/Video'); 

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
        .populate('enrolledVideos') // populate để lấy chi tiết video
        .lean();

      const enrolledVideos = populatedUser?.enrolledVideos || [];

      res.render('user/home', {
        user,
        totalCredits,
        monNo,
        totalCreditsExceeded,
        totalNoSubjects,
        enrolledVideos,
      });
    } catch (error) {
      console.error("Lỗi trang chủ:", error);
      next(error);
    }
  }
}

module.exports = new HomeController();
