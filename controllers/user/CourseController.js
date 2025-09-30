const Course = require('../../models/Course');
const Score = require('../../models/Score');
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

      const existing = await Course.findOne({ user: userId, maHocPhan });
      if (existing) {
        return res.status(400).send("Mã học phần đã tồn tại.");
      }

      await Course.create({ user: userId, maHocPhan, tenHocPhan, soTinChi });

      res.redirect('/semester'); // hoặc res.json({message:'ok'})
    } catch (err) {
      console.error("Lỗi thêm học phần:", err);
      res.status(500).send("Lỗi server khi thêm học phần.");
    }
  }


  // Thêm học phần vào bảng điểm (Score)
  async addCourseToScore(req, res) {
    try {
      const { HocPhan, gioBatDau, gioKetThuc, thu, diemSo, diemChu } = req.body;
      const userId = req.user?._id || req.session?.user?._id;

      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const course = await Course.findOne({ _id: HocPhan, user: userId });
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần.' });
      }

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
      await newScore.populate('HocPhan');

      res.json({
        message: '✅ Thêm học phần thành công!',
        score: newScore
      });

    } catch (error) {
      console.error('Lỗi khi thêm học phần:', error);
      res.status(500).json({ message: '❌ Lỗi server!' });
    }
  }

  // Import danh sách học phần từ file Excel
  async importCourses(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file Excel để import.' });
      }

      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: 'File Excel không có dữ liệu.' });
      }

      const coursesToImport = [];
      const errors = [];
      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          if (!row.maHocPhan || !row.tenHocPhan || !row.soTinChi) {
            errors.push(`Dòng ${rowNumber}: Thiếu thông tin bắt buộc (maHocPhan, tenHocPhan, soTinChi)`);
            continue;
          }

          const soTinChi = parseInt(row.soTinChi);
          if (isNaN(soTinChi) || soTinChi <= 0) {
            errors.push(`Dòng ${rowNumber}: Số tín chỉ không hợp lệ`);
            continue;
          }

          // Check học phần đã tồn tại cho user này
          const existingCourse = await Course.findOne({ user: userId, maHocPhan: row.maHocPhan.trim() });
          if (existingCourse) {
            skipCount++;
            continue;
          }

          coursesToImport.push({
            user: userId,
            maHocPhan: row.maHocPhan.trim(),
            tenHocPhan: row.tenHocPhan.trim(),
            soTinChi
          });

        } catch (error) {
          errors.push(`Dòng ${rowNumber}: Lỗi xử lý dữ liệu - ${error.message}`);
        }
      }

      if (coursesToImport.length > 0) {
        await Course.insertMany(coursesToImport);
        successCount = coursesToImport.length;
      }

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.redirect('/semester');

    } catch (error) {
      console.error('Lỗi khi import học phần:', error);
      res.status(500).json({ message: '❌ Lỗi server khi import!' });
    }
  }

  // Lấy template Excel để download
  async getExcelTemplate(req, res) {
    try {
      const sampleData = [
        { maHocPhan: 'CS101', tenHocPhan: 'Lập trình C', soTinChi: 3 },
        { maHocPhan: 'CS102', tenHocPhan: 'Cấu trúc dữ liệu', soTinChi: 4 }
      ];

      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(sampleData);

      xlsx.utils.sheet_add_aoa(worksheet, [
        ['maHocPhan', 'tenHocPhan', 'soTinChi']
      ], { origin: 'A1' });

      xlsx.utils.book_append_sheet(workbook, worksheet, 'Courses');

      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="template_courses.xlsx"');

      res.send(buffer);

    } catch (error) {
      console.error('Lỗi khi tạo template Excel:', error);
      res.status(500).json({ message: '❌ Lỗi server khi tạo template!' });
    }
  }

  // Xóa học phần (hard delete cho user)
  async deleteCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id || req.session?.user?._id;

      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const course = await Course.findOne({ _id: courseId, user: userId });
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần.' });
      }

      await Course.deleteOne({ _id: courseId, user: userId });

      res.json({ message: '✅ Xóa học phần thành công!' });

    } catch (error) {
      console.error('Lỗi khi xóa học phần:', error);
      res.status(500).json({ message: '❌ Lỗi server khi xóa học phần!' });
    }
  }
}

module.exports = new CourseController();
