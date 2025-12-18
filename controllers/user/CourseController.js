const Course = require('../../models/Course');
const Score = require('../../models/Score');
const Notification = require('../../models/Notification');
const xlsx = require('xlsx');
const fs = require('fs');

class CourseController {
  // Lấy danh sách học phần của user
  async getCourses(req, res) {
    try {
      if (!req.session.user) {
        return res.render('auth/login', { layout: 'auth' });
      }

      const userId = req.session.user._id;

      // Lấy danh sách học phần của user
      const courses = await Course.find({ user: userId }).sort({ createdAt: -1 }).lean();

      // Lấy danh sách học phần đã đăng ký vào Score
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
      res.status(500).send("❌ Lỗi khi lấy danh sách khóa học");
    }
  }

  async createCourse(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.status(401).send("Bạn chưa đăng nhập.");

      const { maHocPhan, tenHocPhan, soTinChi } = req.body;

      // Kiểm tra mã học phần đã tồn tại
      const existing = await Course.findOne({ user: userId, maHocPhan });
      if (existing) {
        req.session.errorMessage = "❌ Mã học phần đã tồn tại.";
        return res.redirect('/semester');
      }

      // Tạo học phần mới
      const newCourse = await Course.create({
        user: userId,
        maHocPhan,
        tenHocPhan,
        soTinChi
      });

      // ✅ Tạo notification khi thêm học phần
      const courseNotification = new Notification({
        recipient: userId,
        sender: userId,
        type: 'success',
        title: 'Thêm học phần thành công',
        message: `Bạn vừa thêm học phần ${tenHocPhan} (${maHocPhan}).`,
        relatedModel: 'Course',
        relatedId: newCourse._id,
        isRead: false,
        metadata: {
          action: 'createCourse',
          courseCode: maHocPhan,
          courseName: tenHocPhan,
          credits: soTinChi,
          timestamp: new Date()
        }
      });

      await courseNotification.save();
      console.log("🔔 Notification đã lưu:", courseNotification);


      // 🔔 Gửi notification realtime bằng socket
      if (req.io) {
        req.io.to(userId.toString()).emit('new-notification', courseNotification);
      }

      // Gắn session success message
      // req.session.successMessage = '✅ Học phần mới đã được thêm thành công!';
      return res.redirect('/semester');

    } catch (err) {
      console.error("❌ Lỗi thêm học phần:", err);
      req.session.errorMessage = "Lỗi server khi thêm học phần.";
      return res.redirect('/semester');
    }
  }

  // Import danh sách học phần từ file Excel
  async importCourses(req, res) {
    try {
      const data = req.excelData;
      const userId = req.user?._id || req.session?.user?._id;

      let insertedCount = 0;
      let skippedCount = 0;

      for (const row of data) {
        const exists = await Course.findOne({
          user: userId,
          maHocPhan: row.maHocPhan.trim()
        });

        if (exists) {
          skippedCount++;
          continue;
        }

        await Course.create({
          user: userId,
          maHocPhan: row.maHocPhan.trim(),
          tenHocPhan: row.tenHocPhan.trim(),
          soTinChi: Number(row.soTinChi)
        });

        insertedCount++;
      }

      return res.json({
        success: true,
        insertedCount,
        skippedCount,
        message: `Import thành công ${insertedCount} học phần`
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server khi import học phần' });
    }
  }



}

module.exports = new CourseController();
