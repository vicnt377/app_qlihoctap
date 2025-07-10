const Course = require('../models/Course');
const Score = require('../models/Score');

class CourseController {
  // Lấy danh sách khóa học
  async getCourses(req, res) {
    try {
      if (!req.session.user) {
        return res.render('auth/login',{ layout:'auth' });    
      }

      const userId = req.session.user._id;
  
      // Lấy tất cả các khóa học
      const courses = await Course.find();
  
      // Lấy danh sách học phần đã đăng ký của user hiện tại
      const scores = await Score.find({ username: userId }, 'HocPhan').lean();
      const existingCourseIds = scores.map(score => String(score.HocPhan));
  
      res.render('user/course', {
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
      const { HocPhan, gioBatDau, gioKetThuc, thu, diemSo, diemChu } = req.body;
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
        gioBatDau,
        gioKetThuc,
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

async addMultipleCourses(req, res) {
  try {
    const userId = req.user?._id || req.session?.user?._id;
    const { scores } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ message: 'Không có học phần nào được gửi lên.' });
    }

    // Lấy danh sách học phần đã có để loại trừ trùng
    const existingScores = await Score.find({ 
      username: userId,
      HocPhan: { $in: scores.map(s => s.HocPhan) }
    }).select('HocPhan').lean();

    const existingIds = new Set(existingScores.map(s => s.HocPhan.toString()));

    // Lọc các học phần chưa có trong bảng điểm
    const newScoreDocs = scores
      .filter(s => !existingIds.has(s.HocPhan))
      .map(s => ({
        username: userId,
        HocPhan: s.HocPhan,
        thu: s.thu,
        gioBatDau: s.gioBatDau,
        gioKetThuc: s.gioKetThuc
      }));

    if (newScoreDocs.length === 0) {
      return res.status(409).json({ message: 'Tất cả học phần đã tồn tại trong bảng điểm.' });
    }

    await Score.insertMany(newScoreDocs);
    res.json({ message: `✅ Đã thêm ${newScoreDocs.length} học phần thành công!` });

  } catch (error) {
    console.error('Lỗi thêm nhiều học phần:', error);
    res.status(500).json({ message: '❌ Lỗi server khi thêm nhiều học phần.' });
  }
}



}

module.exports = new CourseController();
