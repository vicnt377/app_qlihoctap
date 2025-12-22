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

function evaluateProgressBySemester(
  totalCreditsDone,
  semesterCount,
  TOTAL_PROGRAM_CREDITS
) {
  const MAX_CREDITS_PER_SEMESTER = 20;

  // 🔒 ƯU TIÊN TUYỆT ĐỐI: ĐÃ HOÀN THÀNH → KHÔNG XÉT TRỄ
  if (totalCreditsDone >= TOTAL_PROGRAM_CREDITS) {
    return {
      status: 'completed',
      label: 'Đã hoàn thành chương trình',
      color: 'success',
      ratio: 100
    };
  }

  // Chưa có học kỳ
  if (semesterCount === 0) {
    return {
      status: 'on_time',
      label: 'Chưa có dữ liệu học kỳ',
      color: 'secondary',
      ratio: 0
    };
  }

  const maxPossibleCredits = semesterCount * MAX_CREDITS_PER_SEMESTER;
  const ratio = totalCreditsDone / maxPossibleCredits;

  // Học sớm
  if (ratio >= 0.9) {
    return {
      status: 'early',
      label: 'Học sớm tiến độ',
      color: 'success',
      ratio: Number((ratio * 100).toFixed(1))
    };
  }

  // Đúng tiến độ
  if (ratio >= 0.7) {
    return {
      status: 'on_time',
      label: 'Học đúng tiến độ',
      color: 'primary',
      ratio: Number((ratio * 100).toFixed(1))
    };
  }

  // ❗ CHỈ RƠI VÀO ĐÂY KHI CHƯA HOÀN THÀNH
  return {
    status: 'late',
    label: 'Học trễ tiến độ',
    color: 'danger',
    ratio: Number((ratio * 100).toFixed(1))
  };
}



class ProgressController {
  async getProgress(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      if (!user) return res.redirect('/login-user');

      const TOTAL_PROGRAM_CREDITS = user.totalCredits; // ✅ LẤY TỪ USER

      const scores = await Score.find({ user: userId })
        .populate('HocPhan')
        .lean();

      let totalCredits = 0;
      let diemChuStats = {};
      let monNo = [];
      let completedScores = [];

      scores.forEach(score => {
        if (!score.HocPhan) return;

        const tinChi = score.HocPhan.soTinChi || 0;
        const diemChu = score.diemChu?.toUpperCase();

        // ✅ Chỉ tính tín chỉ đã tích lũy
        if (score.tichLuy && diemChu && diemChu !== 'F') {
          totalCredits += tinChi;
          completedScores.push(score);
        }

        // Thống kê điểm chữ
        if (diemChu) {
          diemChuStats[diemChu] = (diemChuStats[diemChu] || 0) + 1;
          if (diemChu === 'F') monNo.push(score);
        }
      });

      const yearOfStudy = getYearOfStudy(totalCredits);
      const yearText = getYearText(yearOfStudy);

      // ===== HỌC KỲ =====
      const semesters = await Semester.find({ user: userId })
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .sort({ createdAt: 1 })
        .lean();

      const semesterCount = semesters.length;

      // ===== TIẾN ĐỘ =====
      const progressStatus = evaluateProgressBySemester(
        totalCredits,
        semesterCount,
        TOTAL_PROGRAM_CREDITS
      );

      // ===== BIỂU ĐỒ =====
      const labels = [];
      const diemTBHocKy = [];
      const diemTBTichLuy = [];
      const tinChiHocKy = [];
      const tongTinChi = [];

      let tongDiem = 0;
      let tongTin = 0;
      
        const diemChuTinChi = {};

        scores.forEach(s => {
        if (!s.HocPhan || !s.diemChu || !s.tichLuy) return;

        const diemChu = s.diemChu.toUpperCase();
        const tinChi = s.HocPhan.soTinChi || 0;

        if (diemChu !== 'F') {
            diemChuTinChi[diemChu] =
            (diemChuTinChi[diemChu] || 0) + tinChi;
        }
        });

      semesters.forEach(sem => {
        labels.push(`${sem.tenHocKy} - ${sem.namHoc}`);

        let diemHK = 0;
        let tinHK = 0;

        sem.score.forEach(sc => {
          if (!sc.HocPhan || !sc.tichLuy) return;

          const tc = sc.HocPhan.soTinChi;
          const d10 = Number(sc.diemSo);
          if (isNaN(d10) || d10 < 4.0) return;

          const d4 = convertTo4Scale(d10);
          diemHK += d4 * tc;
          tinHK += tc;
        });

        const tbHK = tinHK > 0 ? Number((diemHK / tinHK).toFixed(2)) : null;
        diemTBHocKy.push(tbHK);

        tongDiem += diemHK;
        tongTin += tinHK;

        const tbTL = tongTin > 0 ? Number((tongDiem / tongTin).toFixed(2)) : null;
        diemTBTichLuy.push(tbTL);

        tinChiHocKy.push(tinHK);
        tongTinChi.push(tongTin);
      });

      res.render('user/progress', {
        user,
        scores,
        totalCredits,
        TOTAL_PROGRAM_CREDITS,

        diemChuStats,
        monNo,
        completedScores,

        yearOfStudy,
        yearText,

        progressStatus,
        semesterCount,

        labels: JSON.stringify(labels),
        diemTBHocKy: JSON.stringify(diemTBHocKy),
        diemTBTichLuy: JSON.stringify(diemTBTichLuy),
        tinChiHocKy: JSON.stringify(tinChiHocKy),
        tongTinChi: JSON.stringify(tongTinChi),
        diemChuTinChi: JSON.stringify(diemChuTinChi),
      });

    } catch (error) {
      console.error('Lỗi lấy tiến độ:', error);
      res.status(500).send('Lỗi server khi lấy tiến độ học tập');
    }
  }
}


module.exports = new ProgressController();


