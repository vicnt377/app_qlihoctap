const Score = require('../../models/Score');
const Course = require('../../models/Course');
const Semester = require('../../models/Semester');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

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
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      if (!user) return res.redirect('/login-user');

      const maxCredits = user.totalCredits || 0;

      // Bộ lọc
      const selectedYear = req.query.year || 'Tất cả';
      const selectedSemester = req.query.semester || 'Tất cả';

      // Phân trang
      const page = parseInt(req.query.page) || 1;
      const limit = 2; // số học kỳ mỗi trang
      const skip = (page - 1) * limit;

      // Lấy tất cả học kỳ
      const allSemesters = await Semester.find({ user: userId })
        .populate({
          path: 'score',
          match: { user: userId },
          populate: { path: 'HocPhan' }
        })
        .lean();

      const semestersWithYear = allSemesters.map(s => {
        let tongDiemHK = 0, tongTinChiHK = 0;

        if (Array.isArray(s.score)) {
          for (const sc of s.score) {
            const diemSo = parseFloat(sc.diemSo);
            if (!isNaN(diemSo) && sc.HocPhan?.soTinChi) {
              const diem4 = convertTo4Scale(diemSo);
              tongDiemHK += diem4 * sc.HocPhan.soTinChi;
              tongTinChiHK += sc.HocPhan.soTinChi;
            }
          }
        }

        const cpa = tongTinChiHK > 0 ? (tongDiemHK / tongTinChiHK).toFixed(2) : null;

        return {
          ...s,
          namHoc: getAcademicYear(s.startDate),
          cpaHK: cpa,
        };
      });

      // Có học kỳ nào không
      const hasSemester = semestersWithYear.length > 0;

      // Lọc
      const filteredSemesters = semestersWithYear.filter(s => {
        const matchYear = selectedYear === 'Tất cả' || getAcademicYear(s.startDate) === selectedYear;
        const matchSemester = selectedSemester === 'Tất cả' || s.tenHocKy === selectedSemester;
        return matchYear && matchSemester && Array.isArray(s.score) && s.score.length > 0;
      });

      // Tổng số trang
      const totalFiltered = filteredSemesters.length;
      const totalPages = Math.ceil(totalFiltered / limit);

      // Lấy đúng trang hiện tại
      const paginatedSemesters = filteredSemesters.slice(skip, skip + limit);

      // Danh sách năm & học kỳ
      const years = [...new Set(semestersWithYear.map(s => getAcademicYear(s.startDate)))];
      const semestersList = [...new Set(semestersWithYear.map(s => s.tenHocKy))];

      // Tính GPA tích lũy
      const allScores = await Score.find({ user: userId, tichLuy: true })
        .populate('HocPhan')
        .lean();

      let tongDiem = 0, tongTinChi = 0;
      for (const score of allScores) {
        const diemSo = parseFloat(score.diemSo);
        if (!isNaN(diemSo) && score.HocPhan?.soTinChi) {
          const diem4 = convertTo4Scale(diemSo);
          tongDiem += diem4 * score.HocPhan.soTinChi;
          tongTinChi += score.HocPhan.soTinChi;
        }
      }
      const gpa = tongTinChi > 0 ? tongDiem / tongTinChi : 0;
      const hocLuc = xepLoaiHocLuc(gpa);

      // Cảnh báo học vụ
      let canhBaoHocVu = '';
      if (gpa < 1.0) canhBaoHocVu = 'Cảnh báo học vụ mức 2 (GPA dưới 1.0)';
      else if (gpa < 1.5) canhBaoHocVu = 'Cảnh báo học vụ mức 1 (GPA dưới 1.5)';

      res.render('user/score', {
        user: req.session.user,
        semesters: paginatedSemesters,
        years,
        semestersList,
        selectedYear,
        selectedSemester,
        gpa: gpa.toFixed(2),
        hocLuc,
        canhBaoHocVu,
        tongTinChi: Number(tongTinChi),
        maxCredits,
        hasSemester,
        // 👇 Dữ liệu phân trang
        pagination: {
          currentPage: page,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
          pages: Array.from({ length: totalPages }, (_, i) => i + 1),
        },
        queryString: req.query,
      });

    } catch (err) {
      console.error('❌ Lỗi khi lấy điểm:', err);
      res.status(500).send('Đã có lỗi xảy ra');
    }
  }

  // Cập nhật điểm số và điểm chữ
  async updateScore(req, res) {
    try {
      const updates = req.body.scores;
      const userId = req.session.user?._id;

      for (const scoreId in updates) {
        let { diemSo, diemChu, tichLuy } = updates[scoreId];

        // Checkbox chỉ tồn tại khi được tick
        tichLuy = tichLuy ? true : false;

        // Convert điểm số
        diemSo = diemSo ? parseFloat(diemSo) : null;

        const updatedScore = await Score.findByIdAndUpdate(
          scoreId,
          { diemSo, diemChu, tichLuy },
          { new: true }
        ).populate('HocPhan');

        if (updatedScore) {
          await Notification.create({
            recipient: userId,
            sender: userId,
            type: 'success',
            title: 'Cập nhật điểm thành công',
            message: `Điểm học phần "${updatedScore.HocPhan.tenHocPhan}" đã được cập nhật.`,
            relatedModel: 'Score',
            relatedId: updatedScore._id
          });
        }
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
