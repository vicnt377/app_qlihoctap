const Score = require('../models/Score');

class ProgressController {
    async getProgress(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).send('Bạn chưa đăng nhập!');
            }
    
            const userId = req.session.user._id;   // lấy _id
            console.log('User info:', req.session.user);
    
            const scores = await Score.find({ username: userId })  // tìm theo ObjectId
                .populate('HocPhan')
                .lean();
    
            let totalCredits = 0;
            const maxCredits = 152;
            let diemChuStats = {};
            let monNo = [];
    
            scores.forEach(score => {
                if (score.HocPhan) {
                    totalCredits += score.HocPhan.soTinChi;
    
                    if (score.diemChu) {
                        const diemChu = score.diemChu.toUpperCase();
                        diemChuStats[diemChu] = (diemChuStats[diemChu] || 0) + 1;
                        if (diemChu === 'F') {
                            monNo.push(score);
                        }
                    }
                }
            });
    
            const totalCreditsExceeded = totalCredits > maxCredits;
    
            res.render('progress', {
                scores,
                totalCredits,
                diemChuStats,
                monNo,
                totalCreditsExceeded,
            });
        } catch (error) {
            console.error("Lỗi lấy tiến độ:", error);
            res.status(500).send("Lỗi server khi lấy tiến độ học tập.");
        }
    }
    
}

module.exports = new ProgressController();
