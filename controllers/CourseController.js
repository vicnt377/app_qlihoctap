const Course = require('../models/Course');
const Score = require('../models/Score');
const { mongooseToObject } = require('../src/util/mongoose');

class CourseController {
  // Hiển thị danh sách khóa học
  async getCourses(req, res) {
    try {
      const courses = await Course.find()
      res.render('course', {
        courses,
        coursesJSON: JSON.stringify(courses),
        semesterId: req.query.semesterId || "",
      });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách khóa học:", err);
      res.status(500).send("Lỗi khi lấy danh sách khóa học");
    }
  }

  // Thêm khóa học
  async addCourseToScore(req, res) {
    try {
      const { courseId } = req.body;
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần!' });
      }
  
      // Tạo Score mặc định, bạn có thể thay đổi logic tính điểm tuỳ ý
      const score = new Score({
        HocPhan: course._id,
        diemSo: '',
        diemChu: ''
      });
  
      await score.save();
  
      return res.status(200).json({ message: 'Thêm học phần thành công!', score });
    } catch (err) {
      console.error('Lỗi khi thêm học phần vào bảng điểm:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ!' });
    }
    
  }

  // Xóa khóa học
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      await Course.findByIdAndDelete(id);
      res.redirect('/course');
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi khi xóa khóa học');
    }
  }

  // Cập nhật tiến độ
  async updateCourse(req, res) {
    try {
        const { id } = req.params;
        const { courseName, instructor, tinchi } = req.body;
        await Course.findByIdAndUpdate(id, { courseName, instructor, tinchi });
        res.redirect('/course');
    } catch (error) {
        console.error('Lỗi khi cập nhật khóa học:', error);
        res.status(500).send('Lỗi khi cập nhật khóa học');
    }
    }
}

module.exports = new CourseController();
