const Course = require('../models/Course');
const Score = require('../models/Score');

class CourseController {
  // Lấy danh sách khóa học
  async getCourses(req, res) {
    try {
      if (!req.session.user) {
        return res.render('login');    
      }

      const userId = req.session.user._id;
  
      // Lấy tất cả các khóa học
      const courses = await Course.find();
  
      // Lấy danh sách học phần đã đăng ký của user hiện tại
      const scores = await Score.find({ username: userId }, 'HocPhan').lean();
      const existingCourseIds = scores.map(score => String(score.HocPhan));
  
      res.render('course', {
        user: req.session.user,
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
    try {
      const { HocPhan, gioHoc, thu, diemSo, diemChu } = req.body;
      console.log('Body:', req.body);
  
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }
  
      // Kiểm tra học phần có tồn tại
      const course = await Course.findById(HocPhan);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần.' });
      }
  
      // Tạo Score mới
      const newScore = new Score({
        HocPhan,
        gioHoc,
        thu,
        diemSo: diemSo ? parseFloat(diemSo) : null,
        diemChu: diemChu || '',
        username: userId
      });
  
      await newScore.save();
  
      res.json({ message: '✅ Thêm học phần thành công! Bạn có thể thêm học phần vào học kỳ mới!!!' });
  
    } catch (error) {
      console.error('Lỗi khi thêm học phần vào bảng điểm:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  }


  
  
}

module.exports = new CourseController();
