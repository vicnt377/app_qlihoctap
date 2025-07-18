const Score = require('../models/Score');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const User = require('../models/User');

// Chuyển điểm 10 sang thang 4
function convertTo4Scale(diemSo) {
  if (diemSo >= 9.0) return 4.0;
  if (diemSo >= 8.0) return 3.5;
  if (diemSo >= 7.0) return 3.0;
  if (diemSo >= 6.5) return 2.5;
  if (diemSo >= 5.5) return 2.0;
  if (diemSo >= 5.0) return 1.5;
  if (diemSo >= 4.0) return 1.0;
  return 0.0;
}

// Phân loại học lực dựa trên GPA
function xepLoaiHocLuc(gpa) {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  if (gpa >= 1.0) return 'Yếu';
  return 'Kém';
}

// Hàm tính năm học từ startDate
function getAcademicYear(startDate) {
  const year = new Date(startDate).getFullYear();
  return `${year} - ${year + 1}`;
}

class ScoreController {
  // Trang xem điểm và tính GPA
  async getScore(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('auth/login');
      }

      const selectedYear = req.query.year || 'Tất cả';
      const selectedSemester = req.query.semester || 'Tất cả';

      const allSemesters = await Semester.find({ username: userId })
        .populate({
          path: 'score',
          match: { username: userId },
          populate: { path: 'HocPhan' }
        })
        .lean();


      // Gắn năm học vào từng học kỳ
      const semestersWithYear = allSemesters.map(s => ({
        ...s,
        namHoc: getAcademicYear(s.startDate)
      }));

      // Lọc theo học kỳ và năm học (nếu chọn)
      const filteredSemesters = semestersWithYear.filter(s => {
        const matchYear = selectedYear === 'Tất cả' || getAcademicYear(s.startDate) === selectedYear;
        const matchSemester = selectedSemester === 'Tất cả' || s.tenHocKy === selectedSemester;
        return matchYear && matchSemester && Array.isArray(s.score) && s.score.length > 0;
      });

      // Danh sách tất cả năm học và học kỳ
      const years = [...new Set(semestersWithYear.map(s => getAcademicYear(s.startDate)))];
      const semestersList = [...new Set(semestersWithYear.map(s => s.tenHocKy))];

      // Tính GPA tích lũy
      const allScores = await Score.find({ username: userId }).populate('HocPhan').lean();
      let tongDiem = 0, tongTinChi = 0;

      for (const score of allScores) {
        if (score.diemSo != null && score.HocPhan?.soTinChi) {
          const diem4 = convertTo4Scale(score.diemSo);
          const tinChi = score.HocPhan.soTinChi;
          tongDiem += diem4 * tinChi;
          tongTinChi += tinChi;
        }
      }

      const gpa = tongTinChi > 0 ? (tongDiem / tongTinChi) : 0;
      const hocLuc = xepLoaiHocLuc(gpa);

      res.render('user/score', {
        user: req.session.user,
        semesters: filteredSemesters,
        years,
        semestersList,
        selectedYear,
        selectedSemester,
        gpa: gpa.toFixed(2),
        cumulative: gpa.toFixed(2),
        hocLuc
      });

    } catch (err) {
      console.error('Lỗi khi lấy điểm:', err);
      res.status(500).send('Đã có lỗi xảy ra');
    }
  }

  // Cập nhật điểm số và điểm chữ
  async updateScore(req, res) {
    try {
      const updates = req.body.scores;

      for (const scoreId in updates) {
        const { diemSo, diemChu } = updates[scoreId];
        await Score.findByIdAndUpdate(scoreId, {
          diemSo: parseFloat(diemSo),
          diemChu: diemChu
        });
      }

      res.redirect('/score');
    } catch (err) {
      console.error('Lỗi khi cập nhật điểm:', err);
      res.status(500).send('Cập nhật điểm thất bại!');
    }
  }
}

module.exports = new ScoreController();
