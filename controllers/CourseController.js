const Course = require('../models/Course');
const Score = require('../models/Score');

class CourseController {
  // Lấy danh sách khóa học
  async getCourses(req, res) {
    try {
      // Lấy tất cả các khóa học
      const courses = await Course.find();

      // Lấy danh sách các học phần đã có trong bảng điểm (Score)
      const scores = await Score.find({}, 'HocPhan').lean();
      const existingCourseIds = scores.map(score => String(score.HocPhan));

      // Truyền các dữ liệu cần thiết vào template
      res.render('course', {
        courses,
        coursesJSON: JSON.stringify(courses),
        existingCourseIdsJSON: JSON.stringify(existingCourseIds),
      });

    } catch (err) {
      console.error("Lỗi khi lấy danh sách khóa học:", err);
      res.status(500).send("Lỗi khi lấy danh sách khóa học");
    }
  }

  // Thêm học phần vào bảng điểm
  async addCourseToScore(req, res) {
    const { HocPhan, gioHoc, thu } = req.body;
    console.log('Body:', req.body); // <--- thêm dòng này
    try {
      // Kiểm tra học phần có tồn tại không
      const course = await Course.findById(HocPhan);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần.' });
      }

      // Tạo mới một điểm và lưu vào cơ sở dữ liệu
      const newScore = new Score({ HocPhan, gioHoc, thu });
      await newScore.save();

      // Trả về thông báo thành công
      res.json({ message: '✅ Thêm học phần thành công!' });
    } catch (error) {
      console.error('Lỗi khi thêm học phần vào bảng điểm:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  }
}

module.exports = new CourseController();
