const Score = require('../models/Score')
const Course = require('../models/Course')
const Semester = require('../models/Semester')
const User = require('../models/User')

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

function xepLoaiHocLuc(gpa) {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  if (gpa >= 1.0) return 'Yếu';
  return 'Kém';
}


class ScoreController {
  async getScore(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
  
      if (!userId) {
        return res.render('auth/login'); 
      }
  
      const year = req.query.year || '2021 - 2022';
      const semesterName = req.query.semester || 'Học Kỳ 1';
  
      // Chuẩn bị bộ lọc năm học + học kỳ
      const filter = {};
      if (year !== 'Tất cả') filter.namHoc = year;
      if (semesterName !== 'Tất cả') filter.tenHocKy = semesterName;
  
      // Lấy Semester + populate Score và Course
      const semesters = await Semester.find(filter)
        .populate({
          path: 'score',
          match: { username: userId },  // Chỉ lấy score của user luôn
          populate: { path: 'HocPhan', model: 'Course' }
        })
        .lean();
  
      // Giữ lại chỉ các Semester có score
      const userSemesters = semesters.filter(sem => sem.score.length > 0);
  
      const years = await Semester.distinct('namHoc');
      const semestersList = await Semester.distinct('tenHocKy');
  
      // Tính GPA
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
        semesters: userSemesters,
        years,
        semestersList,
        selectedYear: year,
        selectedSemester: semesterName,
        gpa: gpa.toFixed(2),
        cumulative: gpa.toFixed(2),
        hocLuc
      });
  
    } catch (err) {
      console.error('Lỗi khi lấy điểm:', err);
      res.status(500).send('Đã có lỗi xảy ra');
    }
  }
  
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

