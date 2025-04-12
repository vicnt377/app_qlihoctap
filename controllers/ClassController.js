const Semester = require('../models/Semester');
const Score = require('../models/Score');

class ClassController {
    async getClass(req, res) {
        try {
            const { semester, year } = req.query;

            // Lấy học kỳ được chọn
            const semesterDoc = await Semester.findOne({
                tenHocKy: semester,
                namHoc: year
            }).populate({
                path: 'score',
                populate: { path: 'HocPhan' } // Lấy chi tiết tên học phần
            }).lean();

            const classes = semesterDoc ? semesterDoc.score : [];

            // Lấy danh sách tất cả năm học và học kỳ để dùng cho dropdown
            const years = await Semester.distinct('namHoc');
            const semestersList = await Semester.distinct('tenHocKy');

            res.render('class', {
                classes,
                selectedSemester: semester,
                selectedYear: year,
                years,
                semestersList
            });

        } catch (error) {
            console.error('Lỗi lấy lịch học:', error.message);
            res.status(500).send('Lỗi khi lấy dữ liệu lớp học!');
        }
    }
}

module.exports = new ClassController();
