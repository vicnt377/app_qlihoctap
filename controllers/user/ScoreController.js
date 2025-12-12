const Score = require('../../models/Score');
const Course = require('../../models/Course');
const Semester = require('../../models/Semester');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const sendMail = require('../../config/mail/mail');
const MailTemplate = require('../../src/util/emailTemplates');

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

// Xếp loại học lực theo GPA tích lũy
function xepLoaiHocLuc(gpa) {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  if (gpa >= 1.0) return 'Yếu';
  return 'Kém';
}

// xác định trình độ năm học theo tổng tín chỉ tích lũy
function getYearOfStudy(totalCredits) {
  if (totalCredits < 36) return 1;
  if (totalCredits <= 70) return 2;
  if (totalCredits <= 105) return 3;
  if (totalCredits <= 141) return 4;
  return 5;
}

// Lấy mức cảnh báo học vụ cho học kỳ dựa trên các tiêu chí
function getGpaWarningThreshold(year) {
  switch (year) {
    case 1: return 1.2;
    case 2: return 1.4;
    case 3: return 1.6;
    default: return 1.8; // năm 4 và năm 5
  }
}

// Lấy mức cảnh báo học vụ cho học kỳ
function calculateWarningLevel({
  cpaHK,
  gpaTL,
  tongTinChiTichLuy,
  tinChiHongTrongHK,
  tongTinChiDangKyHK,
  tongTinChiNo
}) {
  let level = 0;

  // --- 1. Không đăng ký môn trong học kỳ ---
  if (tongTinChiDangKyHK === 0) {
    return 1; // Không học kỳ -> cảnh báo
  }

  // --- 2. CPA học kỳ dưới chuẩn ---
  if (cpaHK !== null && cpaHK < 1.0) {
    level = Math.max(level, 1);
  }

  // --- 3. TC rớt trong học kỳ vượt quá 50% ---
  if (tongTinChiDangKyHK > 0 && tinChiHongTrongHK / tongTinChiDangKyHK > 0.5) {
    level = Math.max(level, 1);
  }

  // --- 4. Nợ đọng quá 24 tín chỉ ---
  if (tongTinChiNo > 24) {
    level = Math.max(level, 1);
  }

  // --- 5. GPA tích lũy dưới chuẩn năm học ---
  const year = getYearOfStudy(tongTinChiTichLuy);
  const thresholdGPA = getGpaWarningThreshold(year);

  if (gpaTL < thresholdGPA) {
    level = Math.max(level, 1);
  }

  // --- 6. Mức cảnh báo 2 (nghiêm trọng hơn) ---
  // Bạn có thể nâng cấp rule tại đây, ví dụ:
  if (cpaHK !== null && cpaHK < 0.8) {
    level = 2;
  }

  return level;
}


class ScoreController {

async getScore(req, res) {
  try {
    const userId = req.session?.user?._id || req.session.userId;
    if (!userId) return res.redirect('/login-user');

    // Lấy tất cả học kỳ + populate score + course
    let semesters = await Semester.find({ user: userId })
      .populate({
        path: 'score',
        populate: { path: 'HocPhan' }
      })
      .sort({ createdAt: 1 })
      .lean();

    let semestersWithScore = [];
    let tongTinChiTichLuyTruoc = 0;

    // Dùng cho tổng kết toàn khóa
    let tongDiemGPA_TongKet = 0;
    let tongTinChiGPA_TongKet = 0;

    semesters.forEach((s) => {
      let tongDiemCPA = 0;
      let tongTinChiCPA = 0;

      let tongDiemGPA = 0;
      let tongTinChiGPA = 0;

      let tinChiTichLuyHK = 0;

      if (Array.isArray(s.score)) {
        for (const sc of s.score) {
          if (!sc.HocPhan) continue;

          const tc = sc.HocPhan.soTinChi;
          const d = parseFloat(sc.diemSo);

          if (isNaN(d)) continue;

          const d4 = convertTo4Scale(d);

          // CPA
          if (sc.tbchk) {
            tongDiemCPA += d4 * tc;
            tongTinChiCPA += tc;
          }

          // GPA kỳ + GPA tổng kết
          if (sc.tichLuy && d >= 4.0) {
            tongDiemGPA += d4 * tc;
            tongTinChiGPA += tc;

            tinChiTichLuyHK += tc;

            // cộng vào tổng kết toàn khóa
            tongDiemGPA_TongKet += d4 * tc;
            tongTinChiGPA_TongKet += tc;
          }
        }
      }

      const cpaHK = tongTinChiCPA > 0 ? Number((tongDiemCPA / tongTinChiCPA).toFixed(2)) : null;
      const gpaHK = tongTinChiGPA > 0 ? Number((tongDiemGPA / tongTinChiGPA).toFixed(2)) : null;

      // Tín chỉ tích lũy cộng dồn
      const tongTinChiTichLuyDenHK = tongTinChiTichLuyTruoc + tinChiTichLuyHK;
      tongTinChiTichLuyTruoc = tongTinChiTichLuyDenHK;

      semestersWithScore.push({
        ...s,
        cpaHK,
        gpaHK,
        tinChiTichLuyHK,
        tongTinChiTichLuyDenHK
      });
    });

    // ====== TÍNH TỔNG KẾT TOÀN KHÓA ======

    const gpaTongKet =
      tongTinChiGPA_TongKet > 0
        ? Number((tongDiemGPA_TongKet / tongTinChiGPA_TongKet).toFixed(2))
        : null;

    const hocLucTongKet = gpaTongKet ? xepLoaiHocLuc(gpaTongKet) : null;

    const tongTinChiTongKet = tongTinChiGPA_TongKet;

    const hasSemester = semesters.length > 0;

    // Cảnh báo học vụ tổng kết (tùy chọn)
    const canhBaoHocVuTongKet =
      gpaTongKet && gpaTongKet < 1.2 ? 'Bạn đang bị cảnh báo học vụ' : null;

    // Render
    res.render('user/score', {
      semesters: semestersWithScore,
      user: req.session.user,

      // Gửi biến tổng kết
      gpaTongKet,
      hocLucTongKet,
      tongTinChiTongKet,
      hasSemester,
      canhBaoHocVuTongKet
    });

  } catch (error) {
    console.error('Lỗi getScore:', error);
    res.status(500).send('Lỗi server khi lấy điểm');
  }
}


  async updateScore(req, res) {
    try {
      const updates = req.body.scores;     // scores[scoreId] = {...}
      const userId = req.session.user?._id;

      let semesterName = null;
      let semesterId = null;

      for (const scoreId of Object.keys(updates)) {
        let {
          diemSo,
          diemChu,
          tichLuy,
          tbchk
        } = updates[scoreId];

        // Chuẩn hóa dữ liệu
        diemSo  = diemSo ? parseFloat(diemSo) : null;
        tichLuy = tichLuy === 'on' || tichLuy === true;
        tbchk   = tbchk === 'on' || tbchk === true;

        const updated = await Score.findByIdAndUpdate(
          scoreId,
          {
            diemSo,
            diemChu,
            tichLuy,
            tbchk
          },
          { new: true }
        ).populate({
          path: 'semester',
          select: 'tenHocKy'
        });

        if (!semesterId && updated.semester) {
          semesterId = updated.semester._id;
          semesterName = updated.semester.tenHocKy;
        }
      }

      // 🔥 Gửi 1 thông báo duy nhất
      if (semesterName) {
        await Notification.create({
          recipient: userId,
          sender: userId,
          type: 'success',
          title: 'Cập nhật điểm học kỳ thành công',
          message: `Bạn đã cập nhật toàn bộ điểm của học kỳ "${semesterName}".`,
          relatedModel: 'Semester',
          relatedId: semesterId
        });
      }

      res.redirect('/score');
    }
    catch (err) {
      console.error('❌ Lỗi khi cập nhật điểm:', err);

      const userId = req.session.user?._id;
      if (userId) {
        await Notification.create({
          recipient: userId,
          sender: userId,
          type: 'error',
          title: 'Cập nhật điểm thất bại',
          message: 'Có lỗi xảy ra khi cập nhật điểm.',
          relatedModel: 'Score'
        });
      }

      res.status(500).send('Cập nhật điểm thất bại!');
    }
  }



}

module.exports = new ScoreController();
