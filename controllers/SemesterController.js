const Semester = require('../models/Semester')
const Score = require('../models/Score')
const Course = require('../models/Course')

class SemesterController {
  async getClass(req, res) {
    try {
      const year = req.query.year || '2021 - 2022';
      const semester = req.query.semester || 'Học Kỳ 1';
  
      const filter = {};
      if (year && year !== 'Tất cả') filter.namHoc = year;
      if (semester && semester !== 'Tất cả') filter.tenHocKy = semester;
  
      // Tìm các học kỳ thỏa điều kiện (có thể là nhiều)
      const semesterDocs = await Semester.find(filter)
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' } // Đảm bảo điểm và học phần được populate đúng
        })
        .lean();
  
      const classesGroupedBySemester = semesterDocs.map(sem => ({
        tenHocKy: sem.tenHocKy,
        namHoc: sem.namHoc,
        scores: sem.score || []
      }));
      
      // Dropdown data
      const years = await Semester.distinct('namHoc');
      const semestersList = await Semester.distinct('tenHocKy');
  
      res.render('semester', {
        classesGroupedBySemester,
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
  

    async addNewSemester(req, res) {
      try {
        const { tenHocKy, namHoc } = req.body;
    
        // Kiểm tra trùng học kỳ
        const existed = await Semester.findOne({ tenHocKy, namHoc });
        if (existed) {
          return res.status(400).json({ message: '❗Học kỳ đã tồn tại!' });
        }
        
        const newSemester = new Semester({ tenHocKy, namHoc });
        await newSemester.save();
    
        // Lấy lại danh sách học kỳ sau khi thêm
        const semesterDocs = await Semester.find().lean();
        
        // Render lại phần "semester" sau khi thêm học kỳ mới
        const years = await Semester.distinct('namHoc');
        const semestersList = await Semester.distinct('tenHocKy');
        
        const classesGroupedBySemester = semesterDocs.map(sem => ({
          tenHocKy: sem.tenHocKy,
          namHoc: sem.namHoc,
          scores: sem.score || []
        }));
    
        // Trả về HTML phần cập nhật danh sách học kỳ
        res.render('semester', {
          classesGroupedBySemester,
          selectedSemester: req.query.semester || 'Tất cả',
          selectedYear: req.query.year || 'Tất cả',
          years,
          semestersList
        });
    
      } catch (error) {
        console.error('Lỗi thêm học kỳ:', error);
        res.status(500).send('Có lỗi xảy ra khi thêm học kỳ mới.');
      }
    }
    
    
}

module.exports = new SemesterController();
