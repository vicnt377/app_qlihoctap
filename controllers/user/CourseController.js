const Course = require('../../models/Course');
const Score = require('../../models/Score');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

class CourseController {
  // Lấy danh sách khóa học
  async getCourses(req, res) {
    try {
      if (!req.session.user) {
        return res.render('auth/login',{ layout:'auth' });    
      }

      const userId = req.session.user._id;
  
      // Lấy tất cả các khóa học
      const courses = await Course.find({ daXoa: false }).sort({ chuongTrinhDaoTao: 1, namNhapHoc: -1, hocKy: 1 });
  
      // Lấy danh sách học phần đã đăng ký của user hiện tại
      const scores = await Score.find({ username: userId }, 'HocPhan').lean();
      const existingCourseIds = scores.map(score => String(score.HocPhan));

      // Lấy danh sách chương trình đào tạo và năm học để filter
      const chuongTrinhDaoTaoList = [...new Set(courses.map(c => c.chuongTrinhDaoTao))];
      const namNhapHocList = [...new Set(courses.map(c => c.namNhapHoc))].sort((a, b) => b - a);
  
      res.render('user/course', {
        user: req.session.user,
        courses,
        coursesJSON: JSON.stringify(courses),
        existingCourseIdsJSON: JSON.stringify(existingCourseIds),
        chuongTrinhDaoTaoList,
        namNhapHocList
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
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const course = await Course.findById(HocPhan);
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
      await newScore.populate('HocPhan'); // << quan trọng để hiển thị tên/mã học phần

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

      // Đọc file Excel
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: 'File Excel không có dữ liệu.' });
      }

      // Validate và xử lý dữ liệu
      const coursesToImport = [];
      const errors = [];
      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 vì Excel bắt đầu từ 1 và có header

        try {
          // Validate dữ liệu bắt buộc
          if (!row.maHocPhan || !row.tenHocPhan || !row.soTinChi) {
            errors.push(`Dòng ${rowNumber}: Thiếu thông tin bắt buộc (mã học phần, tên học phần, số tín chỉ)`);
            continue;
          }

          // Validate số tín chỉ
          const soTinChi = parseInt(row.soTinChi);
          if (isNaN(soTinChi) || soTinChi <= 0) {
            errors.push(`Dòng ${rowNumber}: Số tín chỉ không hợp lệ`);
            continue;
          }

          // Validate chương trình đào tạo
          const chuongTrinhDaoTao = row.chuongTrinhDaoTao || 'Công nghệ thông tin';
          const validChuongTrinh = ['Công nghệ thông tin', 'Kỹ thuật điện', 'Kỹ thuật cơ khí', 'Kinh tế', 'Ngoại ngữ', 'Khác'];
          if (!validChuongTrinh.includes(chuongTrinhDaoTao)) {
            errors.push(`Dòng ${rowNumber}: Chương trình đào tạo không hợp lệ`);
            continue;
          }

          // Validate năm nhập học
          const namNhapHoc = parseInt(row.namNhapHoc) || new Date().getFullYear();
          if (namNhapHoc < 2020 || namNhapHoc > 2030) {
            errors.push(`Dòng ${rowNumber}: Năm nhập học không hợp lệ (2020-2030)`);
            continue;
          }

          // Validate học kỳ
          const hocKy = row.hocKy || 'Học kỳ 1';
          const validHocKy = ['Học kỳ 1', 'Học kỳ 2', 'Học kỳ 3', 'Học kỳ 4', 'Học kỳ 5', 'Học kỳ 6', 'Học kỳ 7', 'Học kỳ 8'];
          if (!validHocKy.includes(hocKy)) {
            errors.push(`Dòng ${rowNumber}: Học kỳ không hợp lệ`);
            continue;
          }

          // Kiểm tra học phần đã tồn tại
          const existingCourse = await Course.findOne({ maHocPhan: row.maHocPhan });
          if (existingCourse) {
            skipCount++;
            continue; // Bỏ qua học phần đã tồn tại
          }

          coursesToImport.push({
            maHocPhan: row.maHocPhan.trim(),
            tenHocPhan: row.tenHocPhan.trim(),
            soTinChi: soTinChi,
            chuongTrinhDaoTao: chuongTrinhDaoTao,
            namNhapHoc: namNhapHoc,
            hocKy: hocKy,
            moTa: row.moTa ? row.moTa.trim() : '',
            importedBy: userId,
            importedAt: new Date()
          });

        } catch (error) {
          errors.push(`Dòng ${rowNumber}: Lỗi xử lý dữ liệu - ${error.message}`);
        }
      }

      // Import các học phần hợp lệ
      if (coursesToImport.length > 0) {
        await Course.insertMany(coursesToImport);
        successCount = coursesToImport.length;
      }

      // Xóa file tạm
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        message: `✅ Import thành công ${successCount} học phần!`,
        successCount,
        skipCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Chỉ trả về 10 lỗi đầu tiên
      });

    } catch (error) {
      console.error('Lỗi khi import học phần:', error);
      res.status(500).json({ message: '❌ Lỗi server khi import!' });
    }
  }

  // Lấy template Excel để download
  async getExcelTemplate(req, res) {
    try {
      // Tạo dữ liệu mẫu
      const sampleData = [
        {
          maHocPhan: 'INT1234',
          tenHocPhan: 'Lập trình Web',
          soTinChi: 3,
          chuongTrinhDaoTao: 'Công nghệ thông tin',
          namNhapHoc: 2024,
          hocKy: 'Học kỳ 1',
          moTa: 'Học phần cơ bản về lập trình web'
        },
        {
          maHocPhan: 'INT1235',
          tenHocPhan: 'Cơ sở dữ liệu',
          soTinChi: 4,
          chuongTrinhDaoTao: 'Công nghệ thông tin',
          namNhapHoc: 2024,
          hocKy: 'Học kỳ 1',
          moTa: 'Học phần về thiết kế và quản lý CSDL'
        }
      ];

      // Tạo workbook
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(sampleData);

      // Thêm header
      xlsx.utils.sheet_add_aoa(worksheet, [
        ['maHocPhan', 'tenHocPhan', 'soTinChi', 'chuongTrinhDaoTao', 'namNhapHoc', 'hocKy', 'moTa']
      ], { origin: 'A1' });

      // Style cho header
      worksheet['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['C1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['D1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['E1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['F1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };
      worksheet['G1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "CCCCCC" } } };

      xlsx.utils.book_append_sheet(workbook, worksheet, 'Học phần mẫu');

      // Tạo buffer
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="template_hoc_phan.xlsx"');

      res.send(buffer);

    } catch (error) {
      console.error('Lỗi khi tạo template Excel:', error);
      res.status(500).json({ message: '❌ Lỗi server khi tạo template!' });
    }
  }

  // Xóa học phần (soft delete)
  async deleteCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id || req.session?.user?._id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy học phần.' });
      }

      // Kiểm tra quyền xóa (chỉ người import mới được xóa)
      if (course.importedBy && course.importedBy.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa học phần này.' });
      }

      // Soft delete
      course.daXoa = true;
      await course.save();

      res.json({ message: '✅ Xóa học phần thành công!' });

    } catch (error) {
      console.error('Lỗi khi xóa học phần:', error);
      res.status(500).json({ message: '❌ Lỗi server!' });
    }
  }
}

module.exports = new CourseController();
