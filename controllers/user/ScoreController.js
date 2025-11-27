// ===============================
//  IMPORT + UTILITIES
// ===============================
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

// Năm học dạng 2024 - 2025
function getAcademicYear(startDate) {
  const y = new Date(startDate).getFullYear();
  return `${y} - ${y + 1}`;
}

// ===============================
//  TÍNH MỨC CẢNH BÁO HỌC VỤ
// ===============================
async function getWarningLevel(userId, semesterId, cpaHK) {

  const semesters = await Semester.find({ user: userId })
    .sort({ startDate: 1 });

  const index = semesters.findIndex(s => s._id.toString() === semesterId.toString());
  const isFirstSemester = index === 0;

  const previous = semesters[index - 1];
  const prevWarning = previous?.warningLevel || 0;

  // -------------------------
  // 🔥 CẢNH BÁO MỨC 2
  // -------------------------
  if (!isFirstSemester && prevWarning === 1 && cpaHK < 1.00) {
    return 2;
  }

  // -------------------------
  // 🔥 CẢNH BÁO MỨC 1
  // -------------------------
  if (isFirstSemester && cpaHK < 0.80) {
    return 1;
  }

  if (!isFirstSemester && cpaHK < 1.00) {
    return 1;
  }

  return 0; // không cảnh báo
}


// ===============================
//  GET SCORE – FULL FEATURE
// ===============================
class ScoreController {

  async getScore(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      if (!user) return res.redirect('/login-user');

      const maxCredits = user.totalCredits || 0;

      // -----------------------------
      //  BỘ LỌC & PHÂN TRANG
      // -----------------------------
      const selectedYear = req.query.year || 'Tất cả';
      const selectedSemester = req.query.semester || 'Tất cả';

      const page = parseInt(req.query.page) || 1;
      const limit = 2;
      const skip = (page - 1) * limit;

      // -----------------------------
      //  LẤY TOÀN BỘ HỌC KỲ
      // -----------------------------
      const allSemesters = await Semester.find({ user: userId })
        .populate({
          path: 'score',
          match: { user: userId },
          populate: { path: 'HocPhan' }
        })
        .lean();

      // -----------------------------
      //  TÍNH CPA MỖI HỌC KỲ
      // -----------------------------
      const semestersWithCPA = [];

      for (const s of allSemesters) {
        let tongDiemHK = 0;
        let tongTinChiHK = 0;

        if (Array.isArray(s.score)) {
          for (const sc of s.score) {
            const d = parseFloat(sc.diemSo);
            if (!isNaN(d) && sc.HocPhan?.soTinChi) {
              const diem4 = convertTo4Scale(d);
              tongDiemHK += diem4 * sc.HocPhan.soTinChi;
              tongTinChiHK += sc.HocPhan.soTinChi;
            }
          }
        }

        const cpaHK = tongTinChiHK > 0
          ? Number((tongDiemHK / tongTinChiHK).toFixed(2))
          : null;

        const namHoc = getAcademicYear(s.startDate);

        // ---- TÍNH MỨC CẢNH BÁO ----
        const warningLevel = await getWarningLevel(userId, s._id, cpaHK);

        // ---- KIỂM TRA XEM CÓ THAY ĐỔI MỨC CẢNH BÁO KHÔNG ----
        const oldWarning = s.warningLevel ?? 0;

        // ---- LƯU MỚI MỨC CẢNH BÁO ----
        if (warningLevel !== oldWarning) {
          await Semester.findByIdAndUpdate(s._id, { warningLevel });
        }

        // ---- GỬI EMAIL CHỈ KHI warningLevel TĂNG ----
        if (warningLevel > oldWarning) {

          const msg = warningLevel === 1
            ? "Cảnh báo học vụ mức 1"
            : "Cảnh báo học vụ mức 2";

          await sendMail({
            to: user.email,
            subject: `⚠ ${msg} – EduSystem`,
            html: MailTemplate.academicWarning(
              user.username,
            )
          });
        }

        semestersWithCPA.push({
          ...s,
          namHoc,
          cpaHK,
          warningLevel
        });
      }

      // -----------------------------
      //  LỌC – PHÂN TRANG
      // -----------------------------
      const filtered = semestersWithCPA.filter(s => {
        const matchYear = selectedYear === 'Tất cả' || s.namHoc === selectedYear;
        const matchSemester = selectedSemester === 'Tất cả' || s.tenHocKy === selectedSemester;
        return matchYear && matchSemester && s.score?.length;
      });

      const totalFiltered = filtered.length;
      const totalPages = Math.ceil(totalFiltered / limit);

      const paginatedSemesters = filtered.slice(skip, skip + limit);

      const years = [...new Set(semestersWithCPA.map(s => s.namHoc))];
      const semestersList = [...new Set(semestersWithCPA.map(s => s.tenHocKy))];

      // -----------------------------
      //  GPA TÍCH LŨY
      // -----------------------------
      const allScores = await Score.find({ user: userId, tichLuy: true })
        .populate('HocPhan')
        .lean();

      let tongDiem = 0, tongTC = 0;

      for (const sc of allScores) {
        const d = parseFloat(sc.diemSo);
        if (!isNaN(d) && sc.HocPhan?.soTinChi) {
          const diem4 = convertTo4Scale(d);
          tongDiem += diem4 * sc.HocPhan.soTinChi;
          tongTC += sc.HocPhan.soTinChi;
        }
      }

      const gpa = tongTC > 0 ? (tongDiem / tongTC) : 0;
      const hocLuc = xepLoaiHocLuc(gpa);

      // -----------------------------
      //  RENDER
      // -----------------------------
      res.render('user/score', {
        user: req.session.user,
        semesters: paginatedSemesters,
        years,
        semestersList,
        selectedYear,
        selectedSemester,
        gpa: gpa.toFixed(2),
        hocLuc,
        tongTinChi: Number(tongTC),
        maxCredits,
        pagination: {
          currentPage: page,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
          pages: Array.from({ length: totalPages }, (_, i) => i + 1),
        },
        queryString: req.query
      });

    } catch (err) {
      console.error("❌ Lỗi getScore:", err);
      res.status(500).send("Đã có lỗi xảy ra");
    }
  }

  async updateScore(req, res) {
    try {
      const updates = req.body.scores;
      const userId = req.session.user?._id;

      let semesterName = null;
      let firstScoreSemester = null;

      // Cập nhật từng score
      for (const scoreId in updates) {
        let { diemSo, diemChu, tichLuy } = updates[scoreId];

        tichLuy = tichLuy ? true : false;
        diemSo = diemSo ? parseFloat(diemSo) : null;

        const updatedScore = await Score.findByIdAndUpdate(
          scoreId,
          { diemSo, diemChu, tichLuy },
          { new: true }
        ).populate({
          path: 'HocPhan'
        }).populate({
          path: 'semester',
          select: 'tenHocKy'
        });

        if (!firstScoreSemester && updatedScore.semester) {
          firstScoreSemester = updatedScore.semester;
          semesterName = updatedScore.semester.tenHocKy;
        }
      }

      // =============================
      // 🔥 Chỉ gửi 1 thông báo duy nhất
      // =============================
      if (semesterName) {
        await Notification.create({
          recipient: userId,
          sender: userId,
          type: 'success',
          title: 'Cập nhật điểm học kỳ thành công',
          message: `Bạn đã cập nhật toàn bộ điểm của học kỳ "${semesterName}".`,
          relatedModel: 'Semester',
          relatedId: firstScoreSemester?._id
        });
      }

      res.redirect('/score');

    } catch (err) {
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
