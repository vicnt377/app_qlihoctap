const Score = require('../../models/Score');
const User = require('../../models/User');

class ProgressController {
    async getProgress(req, res) {
        try {
            const userId = req.user?._id || req.session?.user?._id;
            if (!userId) {
                return res.render('auth/login'); 
            }
    
            const user = await User.findById(userId).lean();
            if (!user) {
                return res.redirect('/login-user');
            }

            const scores = await Score.find({ username: userId })  
                .populate('HocPhan')
                .lean();
    
            let totalCredits = 0;
            const maxCredits = user?.totalCredits || 0;
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

            // ✅ Cờ trạng thái
            const hasSemesters = scores.length > 0;
            const hasMonNo = monNo.length > 0;
    
            res.render('user/progress', {
                user: req.session.user,
                scores,
                totalCredits,
                diemChuStats,
                monNo,
                totalCreditsExceeded,
                maxCredits,
                hasSemesters,
                hasMonNo
            });
        } catch (error) {
            console.error("Lỗi lấy tiến độ:", error);
            res.status(500).send("Lỗi server khi lấy tiến độ học tập.");
        }
    }
}

module.exports = new ProgressController();
