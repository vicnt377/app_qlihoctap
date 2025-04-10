const Semester = require('../models/Semester');

class SemesterController {
  async getSemester(req, res) {
    try {
      const { year, semester } = req.query;

      // Tạo bộ lọc theo năm học và học kỳ nếu có
      const filter = {};
      if (year) filter.namHoc = year;  // Chú ý chuyển sang kiểu số nếu 'namHoc' là Number
      if (semester) filter.tenHocKy = semester;

      // Lấy danh sách semester kèm điểm (populate)
      const semesters = await Semester.find(filter)
        .populate('score')
        .lean();

      const years = await Semester.distinct('namHoc');
      const semestersList = await Semester.distinct('tenHocKy');

      res.render('score', {
        semesters,
        years,
        semestersList,
        selectedYear: year,
        selectedSemester: semester
      });
    } catch (error) {
        console.error("🔥 Lỗi chi tiết:", error.message);
        console.error("🧠 Stack:", error.stack);
        res.status(500).send('Lỗi khi lấy dữ liệu!');
        
    }
  }
}

module.exports = new SemesterController();
