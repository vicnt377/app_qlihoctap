const Semester = require('../models/Semester');
const Score = require('../models/Score');
const Course = require('../models/Course');

class SemesterController {
async getClass(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('login'); 
      }

      const year = req.query.year || '2021 - 2022';
      const semester = req.query.semester || 'Học Kỳ 1';
      const filter = { username: userId };
      if (year && year !== 'Tất cả') filter.namHoc = year;
      if (semester && semester !== 'Tất cả') filter.tenHocKy = semester;
      


      const semesterDocs = await Semester.find(filter)
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .lean();

      const classesGroupedBySemester = semesterDocs.map(sem => {
        // Lọc lại score theo đúng user
        const userScores = (sem.score || []).filter(score => {
          return score.username?.toString() === userId.toString();
        });

        return {
          tenHocKy: sem.tenHocKy,
          namHoc: sem.namHoc,
          scores: userScores
        };
      }).filter(sem => sem.scores.length > 0); // Chỉ giữ học kỳ có score

      // Các dữ liệu dropdown
      const years = await Semester.distinct('namHoc', { username: userId });
      const semestersList = await Semester.distinct('tenHocKy', { username: userId });
      
// const allScores = await Score.find({ username: userId })
//   .populate('HocPhan')
//   .lean();


      // 1. Lấy tất cả scoreId đã nằm trong các học kỳ
      const semesterScores = await Semester.find({ username: userId }).select('score').lean();
      const usedScoreIds = new Set(
        semesterScores.flatMap(s => s.score.map(id => id.toString()))
      );

      // 2. Lấy các Score chưa nằm trong bất kỳ học kỳ nào
      const allScores = await Score.find({
        username: userId,
        _id: { $nin: Array.from(usedScoreIds) }
      })
      .populate('HocPhan')
      .lean();


      res.render('user/semester', {
        user: req.session.user,
        classesGroupedBySemester,
        selectedSemester: semester,
        selectedYear: year,
        years,
        semestersList,
        scores: allScores
      });

    } catch (error) {
      console.error('Lỗi lấy lịch học:', error.message);
      res.status(500).send('Lỗi khi lấy dữ liệu lớp học!');
    }
  }  

  async addNewSemester(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
      }

      const { tenHocKy, namHoc, selectedScores } = req.body;

      const existed = await Semester.findOne({ tenHocKy, namHoc, userId });
      if (existed) {
        return res.status(400).json({ message: '❗Học kỳ đã tồn tại!' });
      }

      // Chuẩn hóa selectedScores thành array
      const scoresToAdd = Array.isArray(selectedScores)
        ? selectedScores
        : selectedScores ? [selectedScores] : [];

      // Kiểm tra tất cả score đều thuộc về user đang đăng nhập
      const validScores = await Score.find({
        _id: { $in: scoresToAdd },
        username: userId
      }).select('_id');

      if (validScores.length !== scoresToAdd.length) {
        return res.status(400).json({ message: 'Bạn chọn điểm không hợp lệ hoặc không thuộc về tài khoản này.' });
      }

      const newSemester = new Semester({
        tenHocKy,
        namHoc,
        score: validScores.map(s => s._id),
        username: userId
      });
      await newSemester.save();

      const populatedSemester = await Semester.findById(newSemester._id)
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .lean();

      const years = await Semester.distinct('namHoc');
      const semestersList = await Semester.distinct('tenHocKy');

      const classesGroupedBySemester = [{
        tenHocKy: populatedSemester.tenHocKy,
        namHoc: populatedSemester.namHoc,
        scores: (populatedSemester.score || []).filter(score => 
          score.username?.toString() === userId.toString()
        )
      }];

      // res.render('semester', {
      //   user: req.session.user,
      //   classesGroupedBySemester,
      //   selectedSemester: tenHocKy,
      //   selectedYear: namHoc,
      //   years,
      //   semestersList,
      //   scores: [] // Sau khi thêm xong, thường làm trống hoặc reload lại nếu cần
      // });

      // Lấy tất cả scoreId đã nằm trong các học kỳ
      const semesterScores = await Semester.find({ username: userId }).select('score').lean();
      const usedScoreIds = new Set(
        semesterScores.flatMap(s => s.score.map(id => id.toString()))
      );

      // Lấy các Score chưa nằm trong bất kỳ học kỳ nào
      const availableScores = await Score.find({
        username: userId,
        _id: { $nin: Array.from(usedScoreIds) }
      })
      .populate('HocPhan')
      .lean();

      res.render('user/semester', {
        user: req.session.user,
        classesGroupedBySemester,
        selectedSemester: tenHocKy,
        selectedYear: namHoc,
        years,
        semestersList,
        scores: availableScores // Chỉ hiển thị các Score chưa được thêm vào bất kỳ học kỳ nào
      });


    } catch (error) {
      console.error('Lỗi thêm học kỳ:', error);
      res.status(500).send('Có lỗi xảy ra khi thêm học kỳ mới.');
    }
  }
}

module.exports = new SemesterController();
