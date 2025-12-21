const Semester = require('../../models/Semester');
const Score = require('../../models/Score');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const helper = require('../../src/util/helper');
const moment = require('moment');
const mongoose = require('mongoose');
class SemesterController {
  async getSemester(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.render("auth/login");

      const user = await User.findById(userId).lean();

      //Lấy tất cả học kỳ + score + course
      const semesterDocs = await Semester.find({ user: userId })
        .populate({
          path: "score",
          populate: { path: "HocPhan" }
        })
        .lean();

      // Nhóm score theo học kỳ
      const classesGroupedBySemester = semesterDocs.map(sem => ({
        _id: sem._id,
        tenHocKy: sem.tenHocKy,
        namHoc: sem.namHoc,
        scores: sem.score || []
      }));

      //  LẤY DANH SÁCH HỌC PHẦN ĐÃ ĐẬU dùng để LOẠI khỏi danh sách thêm
      const passedCourseIds = await Score.find({
        user: userId,
        semester: { $ne: null },
        diemChu: { $ne: 'F' }     //chỉ loại môn ĐẬU
      }).distinct("HocPhan");

      // LẤY DANH SÁCH HỌC PHẦN ĐÃ RỚT
      const failedCourseIds = await Score.find({
        user: userId,
        diemChu: 'F'
      }).distinct('HocPhan');

      const availableCoursesRaw = await Course.find({
        user: userId,
        _id: { $nin: passedCourseIds }
      }).lean();

      const availableCourses = availableCoursesRaw.map(course => ({
        ...course,
        isRetake: failedCourseIds.some(
          id => id.toString() === course._id.toString()
        )
      }));
      
      // Lấy score mồ côi
      const orphanScores = await Score.find({
        user: userId,
        $or: [{ semester: null }, { semester: { $exists: false } }]
      })
        .populate("HocPhan")
        .lean();


      res.render("user/semester", {
        user,
        classesGroupedBySemester,
        courses: availableCourses, 
        scores: orphanScores        
      });

    } catch (error) {
      console.error(" Lỗi getSemester:", error);
      res.status(500).send("Lỗi khi lấy dữ liệu học kỳ!");
    }
  }

  async addNewSemester(req, res) {
    try {
      const userId = req.session.user._id;
      let { tenHocKy, namHoc, selectedCourses } = req.body;

      // Parse lại nếu bị stringify
      if (typeof selectedCourses === "string") {
        try {
          selectedCourses = JSON.parse(selectedCourses);
        } catch (err) {
          return res.status(400).json({ message: "Dữ liệu học phần không hợp lệ." });
        }
      }

      if (!tenHocKy || !namHoc) {
        return res.status(400).json({ message: "Vui lòng nhập tên học kỳ và năm học." });
      }

      if (!Array.isArray(selectedCourses) || selectedCourses.length === 0) {
        return res.status(400).json({ message: "Chưa chọn học phần nào." });
      }
      //  TÍNH TỔNG TÍN CHỈ HỌC KỲ
      const courseIds = selectedCourses.map(c => c.courseId);

      const courses = await Course.find({ _id: { $in: courseIds } }).lean();

      const tongTinChiHocKy = courses.reduce(
        (sum, c) => sum + (c.soTinChi || 0),
        0
      );

      //  Dưới 8 tín chỉ
      if (tongTinChiHocKy < 8) {
        return res.status(400).json({
          message: `Mỗi học kỳ phải đăng ký tối thiểu 8 tín chỉ (hiện tại: ${tongTinChiHocKy} tín chỉ).`
        });
      }
      //  Vượt quá 20 tín chỉ
      if (tongTinChiHocKy > 20) {
        return res.status(400).json({
          message: `Mỗi học kỳ chỉ được đăng ký tối đa 20 tín chỉ (hiện tại: ${tongTinChiHocKy} tín chỉ).`
        });
      }
      // Tạo Semester mới cho người dùng
      const newSemester = await Semester.create({
        tenHocKy,
        namHoc,
        user: userId,
        score: [],
      });

      const scoreIds = [];

      //  Tạo hoặc cập nhật Score tương ứng với từng Course
      for (const course of selectedCourses) {
        const { courseId } = course;

        // Kiểm tra Score cũ chưa gắn Semester nào
        let existingScore = await Score.findOne({
          user: userId,
          HocPhan: courseId,
          semester: null,
        });

        if (existingScore) {
          // Nếu có score mồ côi → gán vào học kỳ mới
          existingScore.semester = newSemester._id;
          await existingScore.save();
          scoreIds.push(existingScore._id);
        } else {
          // Tạo Score mới
          const newScore = await Score.create({
            user: userId,
            HocPhan: courseId,
            semester: newSemester._id,
            diemSo: null,
            diemChu: null,
            tbchk: false,
            tichLuy: true,
          });

          scoreIds.push(newScore._id);
        }
      }

      // Thêm danh sách Score vào Semester
      newSemester.score = scoreIds;
      await newSemester.save();

      //  Gửi thông báo (nếu bạn dùng Notification)
      await Notification.create({
        recipient: userId,
        sender: userId,
        type: "success",
        title: "Thêm học kỳ mới",
        message: `Bạn đã thêm học kỳ "${tenHocKy}" (${namHoc}) thành công.`,
        relatedModel: "Semester",
        relatedId: newSemester._id,
      });

      // Trả về dữ liệu đã populate
      const populatedSemester = await Semester.findById(newSemester._id)
        .populate({
          path: "score",
          populate: { path: "HocPhan", model: "Course" }
        })
        .lean();

      return res.status(200).json({
        message: "Thêm học kỳ thành công!",
        semester: populatedSemester,
      });

    } catch (error) {
      console.error(" Lỗi khi thêm học kỳ:", error);
      res.status(500).json({ message: " Lỗi server khi thêm học kỳ." });
    }
  }

  // async getEditSemesterForm(req, res) {
  //   try {
  //     const userId = req.session?.user?._id;
  //     const semesterId = req.params.id;

  //     const user = await User.findById(userId).lean();

  //     // Lấy học kỳ + score
  //     const semester = await Semester.findOne({
  //       _id: semesterId,
  //       user: userId
  //     })
  //       .populate({
  //         path: "score",
  //         populate: { path: "HocPhan" }
  //       })
  //       .lean();

  //     if (!semester) return res.status(404).send("Không tìm thấy học kỳ");

  //     semester.score = semester.score.filter(s => s && s.HocPhan);

  //     // Lấy tất cả Course
  //     const allCourses = await Course.find({ user: userId }).lean();

  //     // Score thuộc học kỳ khác
  //     const scoresOther = await Score.find({
  //       user: userId,
  //       semester: { $nin: [null, semesterId] }
  //     }).lean();

  //     const excludedCourseIds = new Set(
  //       scoresOther
  //         .map(s => s.HocPhan?.toString())
  //         .filter(Boolean)
  //     );

  //     // Map score thuộc học kỳ hiện tại
  //     const scoreMap = {};
  //     semester.score.forEach(s => {
  //       scoreMap[s.HocPhan._id.toString()] = s;
  //     });

  //     //  Tạo danh sách hiển thị
  //     const courseList = allCourses
  //       .filter(c => {
  //         const cid = c._id.toString();

  //         //  Bị khóa bởi học kỳ khác → ẩn
  //         if (excludedCourseIds.has(cid)) return false;

  //         //  Thuộc học kỳ hiện tại → hiển thị và tick
  //         if (scoreMap[cid]) return true;

  //         //  Course mới → hiển thị
  //         return true;
  //       })
  //       .map(c => {
  //         const cid = c._id.toString();
  //         const sc = scoreMap[cid];

  //         return {
  //           courseId: cid,
  //           scoreId: sc?._id?.toString() || null,
  //           HocPhan: c,
  //           isSelected: !!sc
  //         };
  //       });

  //     // 6️⃣ Render
  //     res.render("user/editSemester", {
  //       user,
  //       semester,
  //       courseList
  //     });

  //   } catch (err) {
  //     console.error(" Lỗi getEditSemesterForm:", err);
  //     res.status(500).send("Lỗi server!");
  //   }
  // }

  async getEditSemesterForm(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      if (!userId) {
        return res.redirect('/login');
      }

      const user = await User.findById(userId).lean();

      // 1️⃣ Lấy học kỳ hiện tại + score + học phần
      const semester = await Semester.findOne({
        _id: semesterId,
        user: userId
      })
        .populate({
          path: 'score',
          populate: { path: 'HocPhan' }
        })
        .lean();

      if (!semester) {
        return res.status(404).send('Không tìm thấy học kỳ');
      }

      // Loại score lỗi (thiếu học phần)
      semester.score = (semester.score || []).filter(
        s => s && s.HocPhan
      );

      // 2️⃣ Lấy toàn bộ học phần của user
      const allCourses = await Course.find({ user: userId }).lean();

      // 3️⃣ Lấy score thuộc các học kỳ KHÁC (có populate để kiểm tra điểm F)
      const scoresOther = await Score.find({
        user: userId,
        semester: { $nin: [null, semesterId] }
      })
        .populate('HocPhan')
        .lean();

      // 4️⃣ Map courseId → score ở học kỳ khác
      const scoreOtherMap = {};
      scoresOther.forEach(s => {
        if (s.HocPhan) {
          scoreOtherMap[s.HocPhan._id.toString()] = s;
        }
      });

      // 5️⃣ Map courseId → score thuộc học kỳ hiện tại
      const scoreMap = {};
      semester.score.forEach(s => {
        scoreMap[s.HocPhan._id.toString()] = s;
      });

      // 6️⃣ Tạo danh sách học phần hiển thị
      const courseList = allCourses
        .filter(course => {
          const cid = course._id.toString();

          // Thuộc học kỳ đang sửa → LUÔN hiển thị
          if (scoreMap[cid]) return true;

          const scoreOther = scoreOtherMap[cid];

          // Chưa từng có score → hiển thị
          if (!scoreOther) return true;

          // Đã học nhưng điểm F → cho phép học lại
          if (scoreOther.diemChu === 'F') return true;

          // Các trường hợp khác → ẩn
          return false;
        })
        .map(course => {
          const cid = course._id.toString();
          const scoreCurrent = scoreMap[cid];
          const scoreOther = scoreOtherMap[cid];

          return {
            courseId: cid,
            scoreId: scoreCurrent?._id?.toString() || null,
            HocPhan: course,
            isSelected: !!scoreCurrent,
            isRetake: !scoreCurrent && scoreOther?.diemChu === 'F'
          };
        });

      // 7️⃣ Render
      res.render('user/editSemester', {
        user,
        semester,
        courseList
      });

    } catch (error) {
      console.error('Lỗi getEditSemesterForm:', error);
      res.status(500).send('Lỗi server!');
    }
  }

  async updateSemester(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      const { tenHocKy, namHoc, selectedItems } = req.body;

      // selectedItems có thể là 1 value hoặc array
      const selectedCourses = Array.isArray(selectedItems)
        ? selectedItems
        : selectedItems ? [selectedItems] : [];

      const semester = await Semester.findOne({ _id: semesterId, user: userId })
        .populate("score")
        .exec();

      if (!semester) {
        return res.status(404).send("Không tìm thấy học kỳ");
      }

      const newScoreIds = [];

      // XỬ LÝ TẤT CẢ COURSE ĐƯỢC TICK
      for (const courseId of selectedCourses) {
        let scoreIdFromForm = req.body[`scoreId_${courseId}`];

        let score = null;

        // ✔ Nếu form gửi lên có scoreId (score đã tồn tại)
        if (scoreIdFromForm && scoreIdFromForm !== "") {
          score = await Score.findById(scoreIdFromForm);
        }

        // ✔ Nếu không có → tìm theo (user + HocPhan)
        if (!score) {
          score = await Score.findOne({
            user: userId,
            HocPhan: courseId
          });
        }

        // ✔ Chưa có → tạo mới
        if (!score) {
          score = await Score.create({
            user: userId,
            HocPhan: courseId,
            semester: semesterId,
            tichLuy: true,
          });
        } else {
          // ✔ Có rồi → update semester
          score.semester = semesterId;
          await score.save();
        }

        newScoreIds.push(score._id);
      }

      // BỎ TICK → GỠ KHỎI HỌC KỲ
      await Score.updateMany(
        {
          user: userId,
          semester: semesterId,
          HocPhan: { $nin: selectedCourses }
        },
        { $set: { semester: null } }
      );

      // CẬP NHẬT LẠI SEMESTER
      semester.tenHocKy = tenHocKy;
      semester.namHoc = namHoc;
      semester.score = newScoreIds;

      await semester.save();

      // 4️⃣ Tạo thông báo
      await Notification.create({
        recipient: userId,
        sender: userId,
        type: "info",
        title: "Cập nhật học kỳ",
        message: `Học kỳ "${semester.tenHocKy}" đã được cập nhật.`,
        relatedModel: "Semester",
        relatedId: semesterId,
      });

      return res.redirect("/semester");

    } catch (err) {
      console.error(" Lỗi updateSemester:", err);
      return res.status(500).send("Cập nhật học kỳ thất bại!");
    }
  }

  async deleteSemester(req, res) {
    try {
      const userId = req.session?.user?._id;
      const semesterId = req.params.id;

      //  Tìm học kỳ
      const semester = await Semester.findOne({
        _id: semesterId,
        user: userId
      });

      if (!semester) {
        return res.status(404).send("Không tìm thấy học kỳ cần xóa");
      }
      
      //  GỠ HOÀN TOÀN DỮ LIỆU HỌC KỲ TRONG SCORE
      await Score.updateMany(
        { semester: semesterId },
        {
          $unset: {
            semester: "",
            diemSo: "",
            diemChu: ""
          },
          $set: {
            tbchk: false,
            tichLuy: false
          }
        }
      );


      //  Xóa Semester
      await Semester.findByIdAndDelete(semesterId);

      //  Notification
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

}

module.exports = new SemesterController();
