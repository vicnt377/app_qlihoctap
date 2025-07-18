const Semester = require('../models/Semester');
const Score = require('../models/Score');
const Course = require('../models/Course');

const helper = require('../src/util/helper');
const moment = require('moment');

class SemesterController {
  async getSemester(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('auth/login'); 
      }
      const courses = await Course.find();

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
        _id: sem._id,
        tenHocKy: sem.tenHocKy,
        startDate: sem.startDate,
        soTuan: sem.soTuan,
        scores: sem.score || []
      })).filter(sem => sem.scores.length > 0);

      const years = semesterDocs.map(sem => new Date(sem.startDate).getFullYear().toString());
      const semestersList = semesterDocs.map(sem => sem.tenHocKy);

      const semesterScores = await Semester.find({ username: userId }).select('score').lean();
      const usedScoreIds = new Set(
        semesterScores.flatMap(s => (s.score || []).map(id => id.toString()))
      );


      const allScores = await Score.find({
        username: userId,
        semester: { $exists: false }
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
        courses,
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
      const userId = req.session.user._id;
      const { tenHocKy, startDate, soTuan, selectedScores } = req.body;

      // Tạo học kỳ mới
      const newSemester = new Semester({
        tenHocKy,
        startDate,
        soTuan,
        username: userId,
      });
      await newSemester.save();

      // Cập nhật các score để gán học kỳ
      await Score.updateMany(
        { _id: { $in: selectedScores } },
        { semester: newSemester._id }
      );

      // Gán danh sách score vào semester
      newSemester.score = selectedScores;
      await newSemester.save();

      // Trả về JSON kết quả
      const populatedSemester = await Semester.findById(newSemester._id)
        .populate({
          path: 'score',
          populate: 'HocPhan'
        })
        .lean();

      res.status(200).json({
        message: '✅ Thêm học kỳ thành công!',
        semester: populatedSemester
      });

    } catch (error) {
      console.error('Lỗi thêm học kỳ:', error);
      res.status(500).json({ message: '❌ Lỗi server khi thêm học kỳ.' });
    }
  }




  async deleteSemester(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      const deleted = await Semester.findOneAndDelete({
        _id: semesterId,
        username: userId,
      });

      if (!deleted) {
        return res.status(404).send('Không tìm thấy học kỳ cần xóa');
      }

      res.redirect('/semester');
    } catch (error) {
      console.error('Lỗi khi xóa học kỳ:', error);
      res.status(500).send('Lỗi máy chủ khi xóa học kỳ.');
    }
  }


  async editSemesterForm(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      const semester = await Semester.findOne({ _id: semesterId, username: userId })
        .populate({ path: 'score', populate: 'HocPhan' })
        .lean();

      if (!semester) {
        return res.status(404).send('Không tìm thấy học kỳ');
      }

      const allScores = await Score.find({ username: userId })
        .populate('HocPhan')
        .lean();

      const selectedScoreIds = semester.score?.map(s => s._id.toString()) || [];

      res.render('user/editSemester', {
        semester,
        allScores,
        selectedScoreIds,
      });
    } catch (err) {
      console.error('Lỗi khi lấy form sửa học kỳ:', err);
      res.status(500).send('Lỗi server khi hiển thị form sửa học kỳ.');
    }
  }

  async updateSemester(req, res) {
    const userId = req.session?.user?._id;
    const semesterId = req.params.id;
    const { tenHocKy, startDate, soTuan, selectedScores, scores } = req.body;

    const scoresToAdd = Array.isArray(selectedScores)
      ? selectedScores
      : selectedScores ? [selectedScores] : [];

    const validScores = await Score.find({
      _id: { $in: scoresToAdd },
      username: userId,
    });

    // Cập nhật thông tin từng score
    for (let score of validScores) {
      const updates = scores?.[score._id.toString()];
      if (updates) {
        score.thu = updates.thu;
        score.gioBatDau = updates.gioBatDau;
        score.gioKetThuc = updates.gioKetThuc;
        await score.save();
      }
    }

    // Cập nhật học kỳ
    const semester = await Semester.findOneAndUpdate(
      { _id: semesterId, username: userId },
      {
        tenHocKy,
        startDate: new Date(startDate),
        soTuan: parseInt(soTuan),
        score: validScores.map(s => s._id),
      },
      { new: true }
    );

    if (!semester) return res.status(404).send('Không tìm thấy học kỳ');

    // cập nhật endDate
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    semester.endDate = new Date(new Date(startDate).getTime() + soTuan * msPerWeek);
    await semester.save();

    res.redirect('/semester');
  }

}

module.exports = new SemesterController();
