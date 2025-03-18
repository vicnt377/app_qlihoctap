const Course = require('../models/Course');
const { mongooseToObject } = require('../src/util/mongoose');

class CourseController {
  // Hiển thị danh sách khóa học
  async getCourses(req, res) {
    try {
      const courses = await Course.find();
      res.render('course', { 
        courses: courses.map(course => mongooseToObject(course)) 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi khi lấy danh sách khóa học');
    }
  }

  // Thêm khóa học
  async addCourse(req, res) {
    try {
      const { courseName, instructor,tinchi } = req.body;
      await Course.create({ courseName, instructor,tinchi });
      res.redirect('/course');
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi khi thêm khóa học');
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
