const Score = require('../models/Score');
const Course = require('../models/Course');

class ProgressController {
  async getProgress(req, res) {
    try {
      // Lấy tất cả các điểm đã có
      const scores = await Score.find()
        .populate('HocPhan') // Lấy thông tin học phần (tenHocPhan, soTinChi)
        .lean();

      // Tính tổng số tín chỉ đã hoàn thành
      let totalCredits = 0;
      scores.forEach(score => {
        if (score.HocPhan) {
          totalCredits += score.HocPhan.soTinChi;
        }
      });

      res.render('progress', {
        scores,
        totalCredits,
      });
    } catch (error) {
      console.error("Lỗi khi lấy tiến độ:", error);
      res.status(500).send("Lỗi server khi lấy tiến độ học tập.");
    }
  }
}

module.exports = new ProgressController();
