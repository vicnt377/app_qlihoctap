const Score = require('../models/Score')
const Course = require('../models/Course')
const Semester = require('../models/Semester')

class ScoreController{
    async getScore(req, res) {
        try {
        const year = req.query.year || '2021 - 2022';
        const semester = req.query.semester || 'Học Kỳ 1';
      
        const filter = {};
        // if (year) filter.namHoc = year;
        // if (semester) filter.tenHocKy = semester;
        if (year && year !== 'Tất cả') filter.namHoc = year;
        if (semester && semester !== 'Tất cả') filter.tenHocKy = semester;
      
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
    
}


module.exports = new ScoreController();