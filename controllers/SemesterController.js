const Semester = require('../models/Semester')
const Score = require('../models/Score')
const Course = require('../models/Course')

class SemesterController {
    async getSemester(req, res) {
        try {
          const { year, semester } = req.query;
      
          const filter = {};
          if (year) filter.namHoc = year;
          if (semester) filter.tenHocKy = semester;
      
          // Truy vấn Semester, populate Score và trong Score populate tiếp Course
          const semesters = await Semester.find(filter)
            .populate({
              path: 'score',
              populate: {
                path: 'HocPhan', // populate từ Score -> Course
                model: 'Course'
              }
            })
            .lean();
      
          // Lấy danh sách các năm học và học kỳ duy nhất
          const years = await Semester.distinct('namHoc');
          const semestersList = await Semester.distinct('tenHocKy');
      
          // Trả về view với dữ liệu
          res.render('score', {
            semesters,
            years,
            semestersList,
            selectedYear: year,
            selectedSemester: semester
          });

          console.log(semesters)
        } catch (error) {
          console.error("Lỗi chi tiết:", error.message);
          console.error("Stack:", error.stack);
          res.status(500).send('Lỗi khi lấy dữ liệu!');
        }
      }
      

  async addScoreToSemester(req, res) {
    try {
        const { semesterId } = req.params;
        const { HocPhan, diemSo, diemChu } = req.body;

        // Tạo Score mới
        const newScore = new Score({ HocPhan, diemSo, diemChu });
        const savedScore = await newScore.save();

        // Gắn score vào semester
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(404).send('Semester not found');

        semester.score.push(savedScore._id);
        await semester.save();

        res.redirect('/semester/' + semesterId); // hoặc res.json({ success: true })
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}
}

module.exports = new SemesterController();
