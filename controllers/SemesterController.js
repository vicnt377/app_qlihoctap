const Semester = require('../models/Semester');
const Score = require('../models/Score');
const Course = require('../models/Course');

const helper = require('../src/util/helper');

class SemesterController {
  async getClass(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('auth/login'); 
      }

      const semesterDocs = await Semester.find({ username: userId })
        .populate({
          path: 'score',
          populate: [
            { path: 'HocPhan' },
            { path: 'username' }
          ]
        })
        .lean();

      const classesGroupedBySemester = semesterDocs.map(sem => ({
        tenHocKy: sem.tenHocKy,
        startDate: sem.startDate,
        soTuan: sem.soTuan,
        scores: sem.score || []
      })).filter(sem => sem.scores.length > 0);

      const years = semesterDocs.map(sem => new Date(sem.startDate).getFullYear().toString());
      const semestersList = semesterDocs.map(sem => sem.tenHocKy);

      const semesterScores = await Semester.find({ username: userId }).select('score').lean();
      const usedScoreIds = new Set(
        semesterScores.flatMap(s => s.score.map(id => id.toString()))
      );

      const allScores = await Score.find({
        username: userId,
        _id: { $nin: Array.from(usedScoreIds) }
      })
        .populate('HocPhan')
        .lean();

      const events = helper.generateEvents(semesterDocs);

      res.render('user/semester', {
        user: req.session.user,
        classesGroupedBySemester,
        selectedSemester: '',
        selectedYear: '',
        years,
        semestersList,
        scores: allScores,
        events,
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

      const { tenHocKy, startDate, soTuan, selectedScores } = req.body;

      if (!tenHocKy || !startDate || !soTuan) {
        return res.status(400).json({ message: 'Vui lòng điền đủ thông tin học kỳ!' });
      }

      const scoresToAdd = Array.isArray(selectedScores)
        ? selectedScores
        : selectedScores ? [selectedScores] : [];

      const validScores = await Score.find({
        _id: { $in: scoresToAdd },
        username: userId
      }).select('_id');

      if (validScores.length !== scoresToAdd.length) {
        return res.status(400).json({ message: 'Bạn chọn điểm không hợp lệ hoặc không thuộc về tài khoản này.' });
      }

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + parseInt(soTuan) * 7);

      const newSemester = new Semester({
        tenHocKy,
        startDate: start,
        endDate: end,
        soTuan: parseInt(soTuan),
        score: validScores.map(s => s._id),
        username: userId
      });
      await newSemester.save();

      const semesterDocs = await Semester.find({ username: userId })
        .populate({
          path: 'score',
          populate: [
            { path: 'HocPhan' },
            { path: 'username' }
          ]
        })
        .lean();

      const classesGroupedBySemester = semesterDocs.map(sem => ({
        tenHocKy: sem.tenHocKy,
        startDate: sem.startDate,
        soTuan: sem.soTuan,
        scores: sem.score || []
      })).filter(sem => sem.scores.length > 0);

      const years = semesterDocs.map(sem => new Date(sem.startDate).getFullYear().toString());
      const semestersList = semesterDocs.map(sem => sem.tenHocKy);

      const semesterScores = await Semester.find({ username: userId }).select('score').lean();
      const usedScoreIds = new Set(
        semesterScores.flatMap(s => s.score.map(id => id.toString()))
      );

      const availableScores = await Score.find({
        username: userId,
        _id: { $nin: Array.from(usedScoreIds) }
      }).populate('HocPhan').lean();

      const events = helper.generateEvents(semesterDocs);
      console.log("Flat events to render:", JSON.stringify(flatEvents, null, 2));

      res.render('user/semester', {
        user: req.session.user,
        classesGroupedBySemester,
        selectedSemester: tenHocKy,
        selectedYear: new Date(startDate).getFullYear().toString(),
        years,
        semestersList,
        scores: availableScores,
        events,
      });

    } catch (error) {
      console.error('Lỗi thêm học kỳ:', error);
      res.status(500).send('Có lỗi xảy ra khi thêm học kỳ mới.');
    }
  }
}

module.exports = new SemesterController();
