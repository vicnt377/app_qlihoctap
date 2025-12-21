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

      const semesters = await Semester.find({ user: userId })
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .sort({ createdAt: 1 })
        .lean();

      let semestersWithScore = [];
      let tongTinChiTichLuyTruoc = 0;

      let tongDiemGPA_TongKet = 0;
      let tongTinChiGPA_TongKet = 0;

      let currentMaxWarningLevel = 0;
      let latestWarning = null;

      semesters.forEach((s, index) => {
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
          const d = parseFloat(sc.diemSo);

          tongTinChiDangKyHK += tc;

          //  CHỈ CẦN 1 MÔN CHƯA CÓ ĐIỂM
          if (isNaN(d)) {
            allSubjectsScored = false;
            continue; // vẫn cho vòng lặp chạy tiếp để tính thống kê
          }

          if (d < 4.0) tinChiHongTrongHK += tc;

          const d4 = convertTo4Scale(d);

          if (sc.tbchk) {
            tongDiemCPA += d4 * tc;
            tongTinChiCPA += tc;
          }

          if (sc.tichLuy && d >= 4.0) {
            tongDiemGPA += d4 * tc;
            tongTinChiGPA += tc;
            tinChiTichLuyHK += tc;

            tongDiemGPA_TongKet += d4 * tc;
            tongTinChiGPA_TongKet += tc;
          }
        }


        const cpaHK = tongTinChiCPA
          ? ((tongDiemCPA / tongTinChiCPA).toFixed(2))
          : null;

        const gpaHK = tongTinChiGPA
          ? ((tongDiemGPA / tongTinChiGPA).toFixed(2))
          : null;

        const tongTinChiTichLuyDenHK =
          tongTinChiTichLuyTruoc + tinChiTichLuyHK;
        tongTinChiTichLuyTruoc = tongTinChiTichLuyDenHK;

        const gpaTL = tongTinChiGPA_TongKet
          ? tongDiemGPA_TongKet / tongTinChiGPA_TongKet
          : 0;
        // Nếu học kỳ chưa có đủ điểm → KHÔNG xét cảnh báo, KHÔNG gửi mail
        if (tongTinChiDangKyHK === 0 || !allSubjectsScored) {
          semestersWithScore.push({
            ...s,
            cpaHK: null,
            gpaHK: null,
            tinChiTichLuyHK,
            tongTinChiTichLuyDenHK,
            warningLevel: 0
          });
          return;
        }

        // CẢNH BÁO HỌC VỤ 
        const reasons = getWarningReasons({
          cpaHK,
          gpaTL,
          tongTinChiTichLuy: tongTinChiTichLuyDenHK,
          tinChiHongTrongHK,
          tongTinChiDangKyHK,
          tongTinChiNo: 0,
          isFirstSemester: index === 0,
          khoaHoc: user.khoaHoc
        });

        let warningLevel = 0;
        if (reasons.length > 0) warningLevel = 1;
        if (reasons.some(r => r.includes('0.80'))) warningLevel = 2;

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
      });

      // ===== TỔNG KẾT TOÀN KHÓA =====
      const gpaTongKet =
        tongTinChiGPA_TongKet > 0
          ? ((tongDiemGPA_TongKet / tongTinChiGPA_TongKet).toFixed(2))
          : null;

      let canhBaoHocVuTongKet = null;
      if (gpaTongKet !== null && gpaTongKet < 1.2) {
        canhBaoHocVuTongKet = 'Bạn đang bị cảnh báo học vụ';
        currentMaxWarningLevel = Math.max(currentMaxWarningLevel, 1);
      }

      const hocLucTongKet = gpaTongKet ? xepLoaiHocLuc(gpaTongKet) : null;
      const tongTinChiTongKet = tongTinChiGPA_TongKet;

      // ===== GỬI MAIL (CHỈ KHI CẢNH BÁO TĂNG) =====
        const hasRealScore =
          latestWarning &&
          latestWarning.cpaHK !== null &&     // có CPA
          latestWarning.gpaTL > 0;             // có GPA tích lũy thực

        if (
          hasRealScore &&
          currentMaxWarningLevel > (user.lastAcademicWarningLevel || 0)
        ) {

          const warningHtml = `
            <h3 style="color:#d9534f; margin-bottom:10px;">
            Cảnh báo học vụ
            </h3>

            <p>
              <strong>Học kỳ:</strong> ${latestWarning.tenHocKy} (${latestWarning.namHoc})
            </p>

            <p style="margin-top:10px; margin-bottom:5px;">
              <strong>Lý do cảnh báo:</strong>
            </p>

            <ul style="color:#d9534f; padding-left:20px;">
              ${latestWarning.reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>

            <table style="border-collapse:collapse; margin-top:10px;">
              <tr>
                <td style="padding:6px 12px;"><strong>CPA học kỳ:</strong></td>
                <td style="padding:6px 12px; color:#d9534f; font-weight:bold;">
                  ${latestWarning.cpaHK ?? 'Chưa có'}
                </td>
              </tr>
              <tr>
                <td style="padding:6px 12px;"><strong>GPA tích lũy:</strong></td>
                <td style="padding:6px 12px; color:#d9534f; font-weight:bold;">
                  ${latestWarning.gpaTL.toFixed(2)}
                </td>
              </tr>
            </table>
          `;


        await sendMail({
          to: user.email,
          subject: 'Cảnh báo học vụ – EduSystem',
          html: MailTemplate.academicWarning(user.username, warningHtml)
        });

        await User.findByIdAndUpdate(user._id, {
          lastAcademicWarningLevel: currentMaxWarningLevel
        });
      }

      res.render('user/score', {
        semesters: semestersWithScore,
        user: req.session.user,
        gpaTongKet,
        hocLucTongKet,
        tongTinChiTongKet,
        hasSemester: semesters.length > 0,
        canhBaoHocVuTongKet
      });

    } catch (err) {
      console.error(err);
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
