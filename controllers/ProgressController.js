const Score = require('../models/Score');

class ProgressController {
    async getProgress(req, res) {
        try {
            const userId = req.user?._id || req.session?.user?._id;
            if (!userId) {
                return res.render('login'); 
            }
    
            // const userId = req.session.user._id;   // lấy _id
    
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
                user: req.session.user,
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
