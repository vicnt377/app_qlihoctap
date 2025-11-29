const Semester = require('../../models/Semester');
const Score = require('../../models/Score');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const helper = require('../../src/util/helper');
const moment = require('moment');

class SemesterController {
  async getSemester(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.render("auth/login");

      const user = await User.findById(userId).lean();

      // 1️⃣ Lấy tất cả học kỳ của user kèm Score + Course
      const semesterDocs = await Semester.find({ user: userId })
        .populate({
          path: "score",
          populate: { path: "HocPhan" }
        })
        .lean();

      // 2️⃣ Nhóm score theo học kỳ
      const classesGroupedBySemester = semesterDocs.map((sem) => ({
        _id: sem._id,
        tenHocKy: sem.tenHocKy,
        startDate: sem.startDate,
        soTuan: sem.soTuan,
        scores: sem.score || []
      }));

      // 3️⃣ Danh sách năm & học kỳ (phục vụ filter)
      const years = semesterDocs.map((sem) =>
        new Date(sem.startDate).getFullYear().toString()
      );
      const semestersList = semesterDocs.map((sem) => sem.tenHocKy);

      // 4. Tìm các HocPhan đang có trong semester (loại score mồ côi)
      const usedCourseIds = await Score.find({
        user: userId,
        semester: { $ne: null }   // 🔥 Chỉ lấy score thuộc học kỳ
      }).distinct('HocPhan');

      // 5. Course chưa được thêm vào bất kỳ học kỳ nào
      const availableCourses = await Course.find({
        user: userId,
        _id: { $nin: usedCourseIds }
      }).lean();

      // 6. Lấy các score mồ côi (semester=null)
      const allScores = await Score.find({
        user: userId,
        $or: [
          { semester: null },
          { semester: { $exists: false } }
        ]
      })
      .populate('HocPhan')
      .lean();


      // 7️⃣ Tạo event cho FullCalendar
      const events = helper.generateEvents(semesterDocs);

      // 8️⃣ Render UI
      res.render("user/semester", {
        user,
        classesGroupedBySemester,
        selectedSemester: "",
        selectedYear: "",
        years,
        semestersList,
        courses: availableCourses,
        scores: allScores,
        events
      });

    } catch (error) {
      console.error("❌ Lỗi getSemester:", error);
      res.status(500).send("Lỗi khi lấy dữ liệu lớp học!");
    }
  }

  async getEditSemesterForm(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;
      const user = await User.findById(userId).lean();
      // 👉 Lấy học kỳ hiện tại + các Score đã gắn
      const semester = await Semester.findOne({ _id: semesterId, user: userId })
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .lean();

      if (!semester) {
        return res.status(404).send('Không tìm thấy học kỳ');
      }

      // 👉 Lấy danh sách Course của user
      const allCourses = await Course.find({ user: userId }).lean();

      // 👉 Lấy map các Score đã có (HocPhan._id → Score)
      const scoreMap = {};
      semester.score?.forEach(sc => {
        scoreMap[sc.HocPhan._id.toString()] = sc;
      });

      // 👉 Tạo danh sách hiển thị: 
      // Nếu Course đã có trong semester → lấy Score
      // Nếu Course chưa có → tạo object giả để user có thể tick thêm
      const courseList = allCourses.map(c => {
        const existingScore = scoreMap[c._id.toString()];
        if (existingScore) {
          return {
            _id: existingScore._id,       // id của Score
            isScore: true,                // đánh dấu đã là Score
            HocPhan: c,
            thu: existingScore.thu,
            gioBatDau: existingScore.gioBatDau,
            gioKetThuc: existingScore.gioKetThuc,
            isSelected: true
          };
        } else {
          return {
            _id: c._id,                   // id của Course (chưa có Score)
            isScore: false,
            HocPhan: c,
            thu: "",
            gioBatDau: "",
            gioKetThuc: "",
            isSelected: false
          };
        }
      });

      res.render('user/editSemester', {
        user,
        semester,
        courseList
      });
    } catch (err) {
      console.error('❌ Lỗi khi lấy form sửa học kỳ:', err);
      res.status(500).send('Lỗi server khi hiển thị form sửa học kỳ.');
    }
  }

  async addNewSemester(req, res) {
    try {
      const userId = req.session.user._id;
      const { tenHocKy, startDate, soTuan, selectedCourses } = req.body;

      // 1️⃣ Tạo học kỳ mới
      const newSemester = await Semester.create({
        tenHocKy,
        startDate,
        soTuan,
        user: userId,
      });

      const scoreIds = [];

      // 2️⃣ Xử lý từng course được chọn
      for (const course of selectedCourses) {
        const { courseId, thu, gioBatDau, gioKetThuc } = course;

        // 🔍 2.1 Kiểm tra xem đã có Score tương ứng chưa
        let existingScore = await Score.findOne({
          user: userId,
          HocPhan: courseId,
          semester: null, // CHỈ lấy các score bị mồ côi
        });

        if (existingScore) {
          // 🔄 2.2 Nếu score bị mồ côi → cập nhật lại vào học kỳ mới
          existingScore.semester = newSemester._id;
          existingScore.thu = thu;
          existingScore.gioBatDau = gioBatDau;
          existingScore.gioKetThuc = gioKetThuc;
          await existingScore.save();

          scoreIds.push(existingScore._id);
        } else {
          // 🆕 2.3 Nếu chưa có score → tạo mới
          const newScore = await Score.create({
            user: userId,
            HocPhan: courseId,
            thu,
            gioBatDau,
            gioKetThuc,
            semester: newSemester._id,
          });

          scoreIds.push(newScore._id);
        }
      }

      // 3️⃣ Lưu danh sách score vào học kỳ
      newSemester.score = scoreIds;
      await newSemester.save();

      // 4️⃣ Thông báo
      await Notification.create({
        recipient: userId,
        sender: userId,
        type: "success",
        title: "Thêm học kỳ mới",
        message: `Bạn đã thêm học kỳ "${tenHocKy}" thành công.`,
        relatedModel: "Semester",
        relatedId: newSemester._id,
      });

      // 5️⃣ Populate để trả về UI
      const populatedSemester = await Semester.findById(newSemester._id)
        .populate({ path: "score", populate: "HocPhan" })
        .lean();

      res.status(200).json({
        semester: populatedSemester,
      });

    } catch (error) {
      console.error("❌ Lỗi khi thêm học kỳ:", error);
      res.status(500).json({ message: "❌ Lỗi server khi thêm học kỳ." });
    }
  }

  async deleteSemester(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      // 1️⃣ Tìm học kỳ
      const semester = await Semester.findOne({
        _id: semesterId,
        user: userId
      });

      if (!semester) {
        return res.status(404).send("Không tìm thấy học kỳ cần xóa");
      }

      // 2️⃣ Gỡ liên kết Score → Semester (BẢO TOÀN SCORE)
      await Score.updateMany(
        { semester: semesterId },
        { $unset: { semester: "" } }
      );

      // 3️⃣ Xóa Semester
      await Semester.findByIdAndDelete(semesterId);

      // 4️⃣ Notification
      await Notification.create({
        recipient: userId,
        sender: userId,
        type: 'warning',
        title: 'Xóa học kỳ',
        message: `Bạn đã xóa học kỳ "${semester.tenHocKy}".`,
        relatedModel: 'Semester',
        relatedId: semesterId
      });

      res.redirect('/semester');

    } catch (error) {
      console.error("Lỗi khi xóa học kỳ:", error);
      res.status(500).send("Lỗi máy chủ khi xóa học kỳ.");
    }
  }

  async updateSemester(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;
      const { tenHocKy, startDate, soTuan, selectedItems, items } = req.body;

      const selectedIds = Array.isArray(selectedItems)
        ? selectedItems
        : selectedItems ? [selectedItems] : [];

      const semester = await Semester.findOne({ _id: semesterId, user: userId })
        .populate("score")
        .exec();

      if (!semester) {
        return res.status(404).send("Không tìm thấy học kỳ");
      }

      const newScoreIds = [];

      for (const itemId of Object.keys(items || {})) {
        const updates = items[itemId];
        const isSelected = selectedIds.includes(itemId);

        const existingScore = await Score.findOne({ _id: itemId, user: userId });

        if (existingScore) {
          if (isSelected) {
            existingScore.thu = updates.thu;
            existingScore.gioBatDau = updates.gioBatDau;
            existingScore.gioKetThuc = updates.gioKetThuc;
            existingScore.semester = semesterId;
            await existingScore.save();
            newScoreIds.push(existingScore._id);
          } else {
            existingScore.semester = null;
            await existingScore.save();
          }
        } else {
          if (isSelected) {
            const newScore = await Score.create({
              user: userId,
              HocPhan: itemId,
              thu: updates.thu,
              gioBatDau: updates.gioBatDau,
              gioKetThuc: updates.gioKetThuc,
              semester: semesterId,
            });
            newScoreIds.push(newScore._id);
          }
        }
      }

      semester.tenHocKy = tenHocKy;
      semester.startDate = new Date(startDate);
      semester.soTuan = parseInt(soTuan);

      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      semester.endDate = new Date(new Date(startDate).getTime() + soTuan * msPerWeek);

      semester.score = newScoreIds;
      await semester.save();

      // 🔔 Thông báo sau khi cập nhật
      await Notification.create({
        recipient: userId,
        sender: userId,
        type: 'info',
        title: 'Cập nhật học kỳ',
        message: `Bạn đã cập nhật học kỳ "${semester.tenHocKy}".`,
        relatedModel: 'Semester',
        relatedId: semesterId
      });

      res.redirect("/semester");
    } catch (err) {
      console.error("❌ Lỗi updateSemester:", err);
      res.status(500).send("Cập nhật học kỳ thất bại!");
    }
  }


}

module.exports = new SemesterController();
