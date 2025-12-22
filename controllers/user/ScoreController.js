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
  if (totalCredits > 141) return 5;
}

// Lấy mức cảnh báo học vụ cho học kỳ dựa trên các tiêu chí
function getGpaWarningThreshold(year) {
  switch (year) {
    case 1: return 1.2;
    case 2: return 1.4;
    case 3: return 1.6;
    default: return 1.8;
  }
}

// Lấy mức cảnh báo học vụ cho học kỳ
function calculateWarningLevel({
  cpaHK,                  // ĐTBCHK
  gpaTL,                  // GPA tích lũy
  tongTinChiTichLuy,      // Tổng TC tích lũy
  tinChiHongTrongHK,      // TC không đạt trong HK
  tongTinChiDangKyHK,     // Tổng TC đăng ký HK
  tongTinChiNo,           // TC nợ đọng
  isFirstSemester,        // HK đầu khóa hay không
}) {
  // Không đăng ký học trong HK =====
  if (tongTinChiDangKyHK === 0) {
    return 1;
  }

  //  ĐTBCHK dưới chuẩn =====
  if (cpaHK !== null) {
    if (isFirstSemester && cpaHK < 0.8) {
      return 1;
    }

    if (!isFirstSemester && cpaHK < 1.0) {
      return 1;
    }
  }

    // TC rớt > 50%
  if (
    tongTinChiDangKyHK > 0 &&
    tinChiHongTrongHK / tongTinChiDangKyHK > 0.5
  ) {
    return 1;
  }

  // TC nợ đọng > 24
  if (tongTinChiNo > 24) {
    return 1;
  }

  // GPA tích lũy dưới chuẩn năm học
  const year = getYearOfStudy(tongTinChiTichLuy);
  const threshold = getGpaWarningThreshold(year);
  if (gpaTL < threshold) {
    return 1;
  }

  // ===== Không cảnh báo =====
  return 0;
}

//  XÁC ĐỊNH LÝ DO CẢNH BÁO HỌC VỤ
function getWarningReasons({
  cpaHK,
  gpaTL,
  tongTinChiTichLuy,
  tinChiHongTrongHK,
  tongTinChiDangKyHK,
  tongTinChiNo,
  isFirstSemester,
  khoaHoc
}) {
  let reasons = [];

  // a) Không đăng ký học kỳ
  if (tongTinChiDangKyHK === 0) {
    reasons.push('Không đăng ký học trong học kỳ mà không được phép');
  }

  // b) ĐTBCHK
  if (cpaHK !== null) {
    if (isFirstSemester && cpaHK < 0.8) {
      reasons.push('ĐTBCHK dưới 0,80 đối với học kỳ đầu khóa');
    }
    if (!isFirstSemester && cpaHK < 1.0) {
      reasons.push('ĐTBCHK dưới 1,00');
    }
  }

  if (
    tongTinChiDangKyHK > 0 &&
    tinChiHongTrongHK / tongTinChiDangKyHK > 0.5
  ) {
    reasons.push(
      'Tổng số tín chỉ không đạt trong học kỳ vượt quá 50% khối lượng đăng ký'
    );
  }

  if (tongTinChiNo > 24) {
    reasons.push('Tổng số tín chỉ nợ đọng vượt quá 24 tín chỉ');
  }
  const year = getYearOfStudy(tongTinChiTichLuy);
  const threshold = getGpaWarningThreshold(year);
  if (gpaTL < threshold) {
    reasons.push(
      `Điểm trung bình tích lũy (${gpaTL.toFixed(2)}) dưới mức quy định cho năm học thứ ${year}`
    );
  }

  return reasons;
}

class ScoreController {

async getScore(req, res) {
  try {
    const userId = req.session?.user?._id || req.session.userId;
    if (!userId) return res.redirect('/login-user');

    const user = await User.findById(userId).lean();

    // ===============================
    // BỘ LỌC
    // ===============================
    const selectedYear = req.query.year || 'Tất cả';
    const selectedSemester = req.query.semester || 'Tất cả';

    // ===============================
    // TOÀN BỘ HỌC KỲ (CHO FILTER)
    // ===============================
    const allSemesters = await Semester.find({ user: userId }).lean();

    const years = [...new Set(allSemesters.map(s => s.namHoc))];
    const semestersList = [...new Set(allSemesters.map(s => s.tenHocKy))];

    // ===============================
    // ÁP DỤNG FILTER
    // ===============================
    let filtered = allSemesters;

    if (selectedYear !== 'Tất cả') {
      filtered = filtered.filter(s => s.namHoc === selectedYear);
    }

    if (selectedSemester !== 'Tất cả') {
      filtered = filtered.filter(s => s.tenHocKy === selectedSemester);
    }

    // ===============================
    // LẤY DỮ LIỆU SAU FILTER
    // ===============================
    const semesters = await Semester.find({
      _id: { $in: filtered.map(s => s._id) }
    })
      .populate({
        path: 'score',
        populate: { path: 'HocPhan' }
      })
      .sort({ createdAt: 1 })
      .lean();

    let semestersWithScore = [];

    // ===============================
    // BIẾN TOÀN KHÓA
    // ===============================
    let tongTinChiTichLuyTruoc = 0;

    let tongDiemGPA_TongKet = 0;
    let tongTinChiGPA_TongKet = 0;

    let currentMaxWarningLevel = 0;
    let latestWarning = null;

    // ===============================
    // DUYỆT HỌC KỲ
    // ===============================
    for (let i = 0; i < semesters.length; i++) {
      const s = semesters[i];

      let tongDiemCPA = 0;
      let tongTinChiCPA = 0;

      let tongDiemGPA = 0;
      let tongTinChiGPA = 0;

      let tinChiTichLuyHK = 0;
      let tinChiHongTrongHK = 0;
      let tongTinChiDangKyHK = 0;

      let allSubjectsScored = true;

      for (const sc of s.score || []) {
        if (!sc.HocPhan) continue;

        const tc = sc.HocPhan.soTinChi;
        const diem = parseFloat(sc.diemSo);
        const laDieuKien = sc.HocPhan.laHocPhanDieuKien;

        tongTinChiDangKyHK += tc;

        if (isNaN(diem)) {
          allSubjectsScored = false;
          continue;
        }

        if (diem < 4.0) tinChiHongTrongHK += tc;

        const diem4 = convertTo4Scale(diem);

        // ===== CPA (CÓ TÍNH HP ĐIỀU KIỆN) =====
        if (sc.tbchk) {
          tongDiemCPA += diem4 * tc;
          tongTinChiCPA += tc;
        }

        // ===== TÍCH LŨY (ĐIỂM ≥ 4.0 – KHÔNG PHÂN BIỆT) =====
        if (sc.tichLuy && diem >= 4.0) {
          tinChiTichLuyHK += tc;

          // GPA học kỳ (KHÔNG tính HP điều kiện)
          if (!laDieuKien) {
            tongDiemGPA += diem4 * tc;
            tongTinChiGPA += tc;
          }

          // GPA toàn khóa (KHÔNG tính HP điều kiện)
          if (!laDieuKien) {
            tongDiemGPA_TongKet += diem4 * tc;
            tongTinChiGPA_TongKet += tc;
          }
        }
      }

      // ===============================
      // TÍNH ĐIỂM
      // ===============================
      const cpaHK = tongTinChiCPA
        ? Number((tongDiemCPA / tongTinChiCPA).toFixed(2))
        : null;

      const gpaHK = tongTinChiGPA
        ? Number((tongDiemGPA / tongTinChiGPA).toFixed(2))
        : null;

      const tongTinChiTichLuyDenHK =
        tongTinChiTichLuyTruoc + tinChiTichLuyHK;

      tongTinChiTichLuyTruoc = tongTinChiTichLuyDenHK;

      const gpaTL = tongTinChiGPA_TongKet
        ? tongDiemGPA_TongKet / tongTinChiGPA_TongKet
        : 0;

      // ===============================
      // CHƯA ĐỦ ĐIỀU KIỆN CẢNH BÁO
      // ===============================
      if (tongTinChiDangKyHK === 0 || !allSubjectsScored) {
        semestersWithScore.push({
          ...s,
          cpaHK: null,
          gpaHK: null,
          tinChiTichLuyHK,
          tongTinChiTichLuyDenHK,
          warningLevel: 0
        });
        continue;
      }

      // ===============================
      // CẢNH BÁO HỌC VỤ (GIỮ LOGIC CŨ)
      // ===============================
      const reasons = getWarningReasons({
        cpaHK,
        gpaTL,
        tongTinChiTichLuy: tongTinChiTichLuyDenHK,
        tinChiHongTrongHK,
        tongTinChiDangKyHK,
        tongTinChiNo: 0,
        isFirstSemester: i === 0,
        khoaHoc: user.khoaHoc
      });

      let warningLevel = 0;
      if (reasons.length > 0) warningLevel = 1;
      if (reasons.some(r => r.includes('0,80') || r.includes('0.80'))) {
        warningLevel = 2;
      }

      if (warningLevel > currentMaxWarningLevel) {
        currentMaxWarningLevel = warningLevel;
        latestWarning = {
          tenHocKy: s.tenHocKy,
          namHoc: s.namHoc,
          reasons,
          cpaHK,
          gpaHK,
          gpaTL
        };
      }

      semestersWithScore.push({
        ...s,
        cpaHK,
        gpaHK,
        tinChiTichLuyHK,
        tongTinChiTichLuyDenHK,
        warningLevel
      });
    }

    // ===============================
    // TỔNG KẾT TOÀN KHÓA
    // ===============================
    const gpaTongKet =
      tongTinChiGPA_TongKet > 0
        ? Number((tongDiemGPA_TongKet / tongTinChiGPA_TongKet).toFixed(2))
        : null;

    const hocLucTongKet = gpaTongKet
      ? xepLoaiHocLuc(gpaTongKet)
      : null;

    let canhBaoHocVuTongKet = null;
    if (gpaTongKet !== null && gpaTongKet < 1.2) {
      canhBaoHocVuTongKet = 'Bạn đang bị cảnh báo học vụ';
      currentMaxWarningLevel = Math.max(currentMaxWarningLevel, 1);
    }

    // ===============================
    // RENDER
    // ===============================
    res.render('user/score', {
      semesters: semestersWithScore,

      years,
      semestersList,
      selectedYear,
      selectedSemester,

      user: req.session.user,
      gpaTongKet,
      hocLucTongKet,
      tongTinChiTongKet: tongTinChiTichLuyTruoc,
      hasSemester: semesters.length > 0,
      canhBaoHocVuTongKet
    });

  } catch (err) {
    console.error('Lỗi getScore:', err);
    res.status(500).send('Lỗi lấy bảng điểm');
  }
}

  async updateScore(req, res) {
    try {
      const updates = req.body.scores;    
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

      // Gửi 1 thông báo duy nhất
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
      console.error(' Lỗi khi cập nhật điểm:', err);

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
