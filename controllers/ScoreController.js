const Score = require('../models/Score')
const Course = require('../models/Course')
const Semester = require('../models/Semester')

class ScoreController{
    index(req, res, next){
        res.render('score')
    }

    async addCourseToSemester(req, res) {
        try {
            const { semesterId, courseId } = req.body;

            // Kiểm tra học kỳ có tồn tại không
            const semester = await Semester.findById(semesterId);
            if (!semester) {
                return res.status(404).json({ message: 'Học kỳ không tồn tại' });
            }

            // Lấy thông tin khóa học từ Course
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: 'Khóa học không tồn tại' });
            }

            // Kiểm tra nếu khóa học đã có điểm trong hệ thống (giả sử trong `Score`)
            let existingScore = await Score.findOne({ maHocPhan: course._id });

            if (!existingScore) {
                // Nếu chưa có điểm, tạo mới với giá trị mặc định hoặc từ dữ liệu trước đó
                existingScore = new Score({
                    maHocPhan: course._id,
                    diemSo: course.diemSo || '',  // Nếu đã có điểm thì lấy từ course, nếu không thì mặc định '0'
                    diemChu: course.diemChu || '' // Nếu đã có điểm thì lấy từ course, nếu không thì mặc định 'F'
                });

                await existingScore.save();
            }

            // Thêm Score vào danh sách của Semester (nếu chưa tồn tại)
            if (!semester.scores.includes(existingScore._id)) {
                semester.scores.push(existingScore._id);
                await semester.save();
            }

            res.status(200).json({ message: 'Thêm học phần thành công', semester });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
}


module.exports = new ScoreController();