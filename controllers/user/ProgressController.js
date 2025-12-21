const Score = require('../../models/Score');
const User = require('../../models/User');
const Semester = require('../../models/Semester');

// Xác định năm học dựa trên tổng tín chỉ đã tích lũy
function getYearOfStudy(totalCredits) {
    if (totalCredits < 36) return 1;
    if (totalCredits <= 70) return 2;
    if (totalCredits <= 105) return 3;
    if (totalCredits <= 141) return 4;
    return 5;
}

// Chuyển đổi năm học sang chuỗi mô tả
function getYearText(year) {
    switch (year) {
        case 1: return 'Năm nhất';
        case 2: return 'Năm hai';
        case 3: return 'Năm ba';
        case 4: return 'Năm tư';
        default: return 'Năm cuối';
    }
}

// Convert điểm 10 sang thang 4
function convertTo4Scale(d) {
  if (d >= 9.0) return 4.0;
  if (d >= 8.0) return 3.5;
  if (d >= 7.0) return 3.0;
  if (d >= 6.5) return 2.5;
  if (d >= 5.5) return 2.0;
  if (d >= 5.0) return 1.5;
  if (d >= 4.0) return 1.0;
  return 0.0;
}

// Đánh giá tiến độ học tập (sớm, trễ, đúng)
function evaluateProgressBySemester(totalCreditsDone, semesterCount) {
  const MAX_CREDITS_PER_SEMESTER = 20;

  const maxPossibleCredits = semesterCount * MAX_CREDITS_PER_SEMESTER;
  const ratio = totalCreditsDone / maxPossibleCredits;

  if (ratio >= 0.9) {
    return {
      status: 'early',
      label: 'Học sớm tiến độ',
      color: 'success',
      ratio: (ratio * 100).toFixed(1)
    };
  }

  if (ratio >= 0.7) {
    return {
      status: 'on_time',
      label: 'Học đúng tiến độ',
      color: 'primary',
      ratio: (ratio * 100).toFixed(1)
    };
  }

  return {
    status: 'late',
    label: 'Học trễ tiến độ',
    color: 'danger',
    ratio: (ratio * 100).toFixed(1)
  };
}

class ProgressController {
    async getProgress(req, res) {
        try {
            const userId = req.user?._id || req.session?.user?._id;
            if (!userId) return res.render('auth/login');

            const user = await User.findById(userId).lean();
            if (!user) return res.redirect('/login-user');

            const scores = await Score.find({ user: userId })
                .populate('HocPhan')
                .lean();

            let totalCredits = 0;
            const maxCredits = user?.totalCredits || 0;

            let diemChuStats = {};
            let monNo = [];
            let completedScores = [];

            scores.forEach(score => {
                if (!score.HocPhan) return;

                const tinChi = score.HocPhan.soTinChi;
                const diemChu = score.diemChu?.toUpperCase();

                //  Chỉ tính tín chỉ đã hoàn thành
                if (score.tichLuy && diemChu && diemChu !== 'F') {
                    totalCredits += tinChi;
                    completedScores.push(score);
                }

                // Thống kê điểm chữ
                if (diemChu) {
                    diemChuStats[diemChu] = (diemChuStats[diemChu] || 0) + 1;

                    if (diemChu === 'F') {
                        monNo.push(score);
                    }
                }
            });

            const totalCreditsExceeded = totalCredits > maxCredits;
            const hasSemesters = scores.length > 0;
            const hasMonNo = monNo.length > 0;

            // Xác định năm học
            const yearOfStudy = getYearOfStudy(totalCredits);
            const yearText = getYearText(yearOfStudy);

            // ===== BIẾN PHỤC VỤ VẼ BIỂU ĐỒ =====
            const semesters = await Semester.find({ user: userId })
                .populate({
                    path: 'score',
                    populate: { path: 'HocPhan' }
                })
                .sort({ createdAt: 1 })
                .lean();

            const labels = [];
            const diemTBHocKy = [];
            const diemTBTichLuy = [];
            const tinChiHocKy = [];
            const tongTinChi = [];

            let tongDiem = 0;
            let tongTin = 0;

            const diemChuToSo = { A: 4, B: 3, C: 2, D: 1, F: 0 };

            semesters.forEach(sem => {
                labels.push(`${sem.tenHocKy} - ${sem.namHoc}`);

                let diemHK = 0;
                let tinHK = 0;

                sem.score.forEach(sc => {
                    if (!sc.HocPhan || !sc.tichLuy) return;

                    const tc = sc.HocPhan.soTinChi;
                    const d10 = Number(sc.diemSo);

                    if (isNaN(d10)) return;

                    if (d10 < 4.0) return;

                    const d4 = convertTo4Scale(d10);

                    diemHK += d4 * tc;
                    tinHK += tc;
                });


                const tbHK =
                tinHK > 0
                    ? Number((diemHK / tinHK).toFixed(2))
                    : 0;

                diemTBHocKy.push(
                    tinHK > 0 ? Number((diemHK / tinHK).toFixed(2)) : null
                );

                tongDiem += diemHK;
                tongTin += tinHK;

                const tbTL =
                tongTin > 0
                    ? Number((tongDiem / tongTin).toFixed(2))
                    : 0;

                diemTBTichLuy.push(tbTL);

                tinChiHocKy.push(tinHK);
                tongTinChi.push(tongTin);
            });

            const diemChuTinChi = {};

            scores.forEach(s => {
            if (!s.HocPhan || !s.diemChu) return;

            const diemChu = s.diemChu.toUpperCase();
            const tinChi = s.HocPhan.soTinChi || 0;

            diemChuTinChi[diemChu] = (diemChuTinChi[diemChu] || 0) + tinChi;
            });

            const semesterCount = semesters.length;

            const progressStatus = evaluateProgressBySemester(
            totalCredits,
            semesterCount
            );

            res.render('user/progress', {
                user,
                scores,
                totalCredits,
                diemChuStats,
                monNo,
                totalCreditsExceeded,
                maxCredits,
                hasSemesters,
                hasMonNo,
                completedScores,
                yearOfStudy,
                yearText,

                // Tiến độ học tập
                progressStatus,
                semesterCount,

                // Dữ liệu biểu đồ
                labels: JSON.stringify(labels),
                diemTBHocKy: JSON.stringify(diemTBHocKy),
                diemTBTichLuy: JSON.stringify(diemTBTichLuy),
                tinChiHocKy: JSON.stringify(tinChiHocKy),
                tongTinChi: JSON.stringify(tongTinChi),
                diemChuTinChi: JSON.stringify(diemChuTinChi),

            });

        } catch (error) {
            console.error("Lỗi lấy tiến độ:", error);
            res.status(500).send("Lỗi server khi lấy tiến độ học tập.");
        }
    }
}

module.exports = new ProgressController();


