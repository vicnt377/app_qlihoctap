const Score = require('../models/Score');

class ProgressController {
    async getProgress(req, res) {
        try {
            const scores = await Score.find()
                .populate('HocPhan')
                .lean();

            let totalCredits = 0;
            let diemChuStats = {};
            let monNo = [];

            scores.forEach(score => {
                if (score.HocPhan) {
                    totalCredits += score.HocPhan.soTinChi;

                    // Đếm điểm chữ
                    const diemChu = score.diemChu.toUpperCase();
                    diemChuStats[diemChu] = (diemChuStats[diemChu] || 0) + 1;

                    // Môn nợ (F)
                    if (diemChu === 'F') {
                        monNo.push(score);
                    }
                }
            });

            res.render('progress', {
                scores,
                totalCredits,
                diemChuStats,
                monNo
            });
        } catch (error) {
            console.error("Lỗi lấy tiến độ:", error);
            res.status(500).send("Lỗi server khi lấy tiến độ học tập.");
        }
    }
}

module.exports = new ProgressController();
