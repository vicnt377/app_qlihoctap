const Semester = require('../../models/Semester');
const Score = require('../../models/Score');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const helper = require('../../src/util/helper');
const moment = require('moment');
const mongoose = require('mongoose');
class SemesterController {
  // async getSemester(req, res) {
  //   try {
  //     const userId = req.user?._id || req.session?.user?._id;
  //     if (!userId) return res.render("auth/login");

  //     const user = await User.findById(userId).lean();

  //     // 1️⃣ Lấy tất cả học kỳ của user kèm Score + Course
  //     const semesterDocs = await Semester.find({ user: userId })
  //       .populate({
  //         path: "score",
  //         populate: { path: "HocPhan" }
  //       })
  //       .lean();

  //     // 2️⃣ Nhóm score theo học kỳ
  //     const classesGroupedBySemester = semesterDocs.map((sem) => ({
  //       _id: sem._id,
  //       tenHocKy: sem.tenHocKy,
  //       startDate: sem.startDate,
  //       soTuan: sem.soTuan,
  //       scores: sem.score || []
  //     }));

  //     // 3️⃣ Danh sách năm & học kỳ (phục vụ filter)
  //     const years = semesterDocs.map((sem) =>
  //       new Date(sem.startDate).getFullYear().toString()
  //     );
  //     const semestersList = semesterDocs.map((sem) => sem.tenHocKy);

  //     // 4. Tìm các HocPhan đang có trong semester (loại score mồ côi)
  //     const usedCourseIds = await Score.find({
  //       user: userId,
  //       semester: { $ne: null }   // 🔥 Chỉ lấy score thuộc học kỳ
  //     }).distinct('HocPhan');

  //     // 5. Course chưa được thêm vào bất kỳ học kỳ nào
  //     const availableCourses = await Course.find({
  //       user: userId,
  //       _id: { $nin: usedCourseIds }
  //     }).lean();

  //     // 6. Lấy các score mồ côi (semester=null)
  //     const allScores = await Score.find({
  //       user: userId,
  //       $or: [
  //         { semester: null },
  //         { semester: { $exists: false } }
  //       ]
  //     })
  //     .populate('HocPhan')
  //     .lean();


  //     // 7️⃣ Tạo event cho FullCalendar
  //     const events = helper.generateEvents(semesterDocs);

  //     // 8️⃣ Render UI
  //     res.render("user/semester", {
  //       user,
  //       classesGroupedBySemester,
  //       selectedSemester: "",
  //       selectedYear: "",
  //       years,
  //       semestersList,
  //       courses: availableCourses,
  //       scores: allScores,
  //       events
  //     });

  //   } catch (error) {
  //     console.error("❌ Lỗi getSemester:", error);
  //     res.status(500).send("Lỗi khi lấy dữ liệu lớp học!");
  //   }
  // }
  // async getEditSemesterForm(req, res) {
  //   try {
  //     const userId = req.session?.user?._id;
  //     const semesterId = req.params.id;

  //     const user = await User.findById(userId).lean();

  //     // 👉 Lấy học kỳ hiện tại + Score trong học kỳ này
  //     const semester = await Semester.findOne({ _id: semesterId, user: userId })
  //       .populate({
  //         path: 'score',
  //         populate: { path: 'HocPhan' }
  //       })
  //       .lean();

  //     if (!semester) {
  //       return res.status(404).send('Không tìm thấy học kỳ');
  //     }

  //     // 👉 Lấy danh sách Course của user
  //     const allCourses = await Course.find({ user: userId }).lean();

  //     // 👉 Lấy Score đang nằm ở HỌC KỲ KHÁC (score.semester != null và != semesterId)
  //     const scoreInOtherSemesters = await Score.find({
  //       user: userId,
  //       semester: { $ne: semesterId, $ne: null }
  //     }).lean();

  //     // 👉 Tập hợp các CourseID cần loại bỏ
  //     const excludedCourseIds = new Set(
  //       scoreInOtherSemesters.map(s => s.HocPhan.toString())
  //     );

  //     // 👉 Map Score trong học kỳ hiện tại
  //     const scoreMap = {};
  //     semester.score?.forEach(sc => {
  //       scoreMap[sc.HocPhan._id.toString()] = sc;
  //     });

  //     // 👉 Tạo danh sách hiển thị
  //     const courseList = allCourses
  //       .filter(c => !excludedCourseIds.has(c._id.toString()))   // 🔥 LOẠI SCORE THUỘC HỌC KỲ KHÁC
  //       .map(c => {
  //         const existingScore = scoreMap[c._id.toString()];

  //         if (existingScore) {
  //           // Course đã thuộc semester hiện tại
  //           return {
  //             _id: existingScore._id,
  //             isScore: true,
  //             HocPhan: c,
  //             thu: existingScore.thu,
  //             gioBatDau: existingScore.gioBatDau,
  //             gioKetThuc: existingScore.gioKetThuc,
  //             isSelected: true
  //           };
  //         } else {
  //           // Course chưa có Score hoặc Score.semester = null
  //           return {
  //             _id: c._id,
  //             isScore: false,
  //             HocPhan: c,
  //             thu: "",
  //             gioBatDau: "",
  //             gioKetThuc: "",
  //             isSelected: false
  //           };
  //         }
  //       });

  //     res.render('user/editSemester', {
  //       user,
  //       semester,
  //       courseList
  //     });

  //   } catch (err) {
  //     console.error('❌ Lỗi khi lấy form sửa học kỳ:', err);
  //     res.status(500).send('Lỗi server khi hiển thị form sửa học kỳ.');
  //   }
  // }
  // async addNewSemester(req, res) {
  //   try {
  //     const userId = req.session.user._id;
  //     let { tenHocKy, startDate, soTuan, selectedCourses } = req.body;

  //     // Nếu selectedCourses là JSON string → parse lại
  //     if (typeof selectedCourses === "string") {
  //       try {
  //         selectedCourses = JSON.parse(selectedCourses);
  //       } catch (err) {
  //         console.log("❌ selectedCourses không parse được:", err);
  //         return res.status(400).json({ message: "Dữ liệu học phần không hợp lệ." });
  //       }
  //     }

  //     // Log kiểm tra
  //     console.log("Selected courses:", selectedCourses);

  //     if (!Array.isArray(selectedCourses) || selectedCourses.length === 0) {
  //       return res.status(400).json({ message: "Chưa chọn học phần nào." });
  //     }

  //     // Tính ngày kết thúc
  //     const newStart = new Date(startDate);
  //     const newEnd = new Date(newStart.getTime() + soTuan * 7 * 24 * 60 * 60 * 1000);

  //     // Kiểm tra trùng học kỳ
  //     const existingSemester = await Semester.findOne({
  //       user: userId,
  //       $expr: {
  //         $and: [
  //           { $lte: ["$startDate", newEnd] },
  //           { $lte: [newStart, "$endDate"] }
  //         ]
  //       }
  //     });

  //     if (existingSemester) {
  //       return res.status(400).json({
  //         message: `Học kỳ mới bị trùng thời gian với học kỳ "${existingSemester.tenHocKy}".`
  //       });
  //     }

  //     // 1️⃣ Tạo học kỳ mới
  //     const newSemester = await Semester.create({
  //       tenHocKy,
  //       startDate: newStart,
  //       endDate: newEnd,
  //       soTuan,
  //       user: userId,
  //       score: [] // KHỞI TẠO RÕ RÀNG
  //     });

  //     const scoreIds = [];

  //     // 2️⃣ Xử lý từng course
  //     for (const course of selectedCourses) {
  //       const { courseId, thu, gioBatDau, gioKetThuc } = course;

  //       // Tìm score bị mồ côi
  //       let existingScore = await Score.findOne({
  //         user: userId,
  //         HocPhan: courseId,
  //         semester: null,
  //       });

  //       if (existingScore) {
  //         existingScore.semester = newSemester._id;
  //         existingScore.thu = thu;
  //         existingScore.gioBatDau = gioBatDau;
  //         existingScore.gioKetThuc = gioKetThuc;
  //         await existingScore.save();

  //         scoreIds.push(existingScore._id);
  //       } else {
  //         const newScore = await Score.create({
  //           user: userId,
  //           HocPhan: courseId,
  //           thu,
  //           gioBatDau,
  //           gioKetThuc,
  //           semester: newSemester._id,
  //         });

  //         scoreIds.push(newScore._id);
  //       }
  //     }

  //     // ❗ 3️⃣ LƯU SCORE VÀO SEMESTER (GỌI SAVE SAU CÙNG)
  //     newSemester.score = scoreIds;
  //     await newSemester.save(); // ← Đây là bước quan trọng

  //     // 4️⃣ Gửi thông báo
  //     await Notification.create({
  //       recipient: userId,
  //       sender: userId,
  //       type: "success",
  //       title: "Thêm học kỳ mới",
  //       message: `Bạn đã thêm học kỳ "${tenHocKy}" thành công.`,
  //       relatedModel: "Semester",
  //       relatedId: newSemester._id,
  //     });

  //     // 5️⃣ Populate trả về
  //     const populated = await Semester.findById(newSemester._id)
  //       .populate({ path: "score", populate: "HocPhan" })
  //       .lean();

  //     res.status(200).json({ semester: populated });

  //   } catch (error) {
  //     console.error("❌ Lỗi khi thêm học kỳ:", error);
  //     res.status(500).json({ message: "❌ Lỗi server khi thêm học kỳ." });
  //   }
  // }
  // async updateSemester(req, res) {
  //   try {
  //     const userId = req.session?.user?._id;
  //     const semesterId = req.params.id;
  //     const { tenHocKy, startDate, soTuan, selectedItems, items } = req.body;

  //     // Chuẩn hoá selectedIds
  //     const selectedIds = Array.isArray(selectedItems)
  //       ? selectedItems
  //       : selectedItems ? [selectedItems] : [];

  //     // Tìm semester hiện tại (để chắc chắn quyền sở hữu và tồn tại)
  //     const semester = await Semester.findOne({ _id: semesterId, user: userId }).populate("score").exec();
  //     if (!semester) {
  //       return res.status(404).send("Không tìm thấy học kỳ");
  //     }

  //     // ----- CHUẨN HÓA NGÀY VÀ SO_TUAN -----
  //     const parsedSoTuan = parseInt(soTuan, 10) || 0;
  //     const newStart = new Date(startDate);
  //     const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  //     const newEnd = new Date(newStart.getTime() + parsedSoTuan * msPerWeek);

  //     // ----- KIỂM TRA TRÙNG KHOẢNG THỜI GIAN (EXCLUDE current semester) -----
  //     // Overlap nếu: existing.startDate <= newEnd && existing.endDate >= newStart
  //     const overlapping = await Semester.findOne({
  //       user: userId,
  //       _id: { $ne: semesterId },            // loại bỏ chính học kỳ đang update
  //       startDate: { $lte: newEnd },
  //       endDate: { $gte: newStart }
  //     }).lean();

  //     if (overlapping) {
  //       // Nếu bạn dùng flash + redirect (form submit), dùng cách này:
  //       if (req.flash) {
  //         req.flash('error_msg', `Thời gian bắt đầu/lâu dài của học kỳ trùng với học kỳ "${overlapping.tenHocKy}". Vui lòng chọn ngày khác.`);
  //         return res.redirect(`/semester/${semesterId}/edit`); // hoặc trang sửa của bạn
  //       }

  //       // Nếu API gọi AJAX, trả JSON lỗi:
  //       return res.status(400).json({
  //         message: `Thời gian học kỳ trùng với học kỳ "${overlapping.tenHocKy}".`
  //       });
  //     }

  //     // ----- XỬ LÝ CÁC ITEMS / SCORE -----
  //     const newScoreIds = [];

  //     for (const itemId of Object.keys(items || {})) {
  //       const updates = items[itemId];
  //       const isSelected = selectedIds.includes(itemId);

  //       const existingScore = await Score.findOne({ _id: itemId, user: userId });

  //       if (existingScore) {
  //         if (isSelected) {
  //           existingScore.thu = updates.thu;
  //           existingScore.gioBatDau = updates.gioBatDau;
  //           existingScore.gioKetThuc = updates.gioKetThuc;
  //           existingScore.semester = semesterId;
  //           await existingScore.save();
  //           newScoreIds.push(existingScore._id);
  //         } else {
  //           existingScore.semester = null;
  //           await existingScore.save();
  //         }
  //       } else {
  //         if (isSelected) {
  //           const newScore = await Score.create({
  //             user: userId,
  //             HocPhan: itemId,
  //             thu: updates.thu,
  //             gioBatDau: updates.gioBatDau,
  //             gioKetThuc: updates.gioKetThuc,
  //             semester: semesterId,
  //           });
  //           newScoreIds.push(newScore._id);
  //         }
  //       }
  //     }

  //     // ----- CẬP NHẬT THÔNG TIN HỌC KỲ -----
  //     semester.tenHocKy = tenHocKy;
  //     semester.startDate = newStart;
  //     semester.soTuan = parsedSoTuan;
  //     semester.endDate = newEnd;
  //     semester.score = newScoreIds;

  //     await semester.save();

  //     // 🔔 Thông báo sau khi cập nhật
  //     await Notification.create({
  //       recipient: userId,
  //       sender: userId,
  //       type: 'info',
  //       title: 'Cập nhật học kỳ',
  //       message: `Bạn đã cập nhật học kỳ "${semester.tenHocKy}".`,
  //       relatedModel: 'Semester',
  //       relatedId: semesterId
  //     });

  //     return res.redirect("/semester");
  //   } catch (err) {
  //     console.error("❌ Lỗi updateSemester:", err);
  //     // Nếu có flash
  //     if (req.flash) {
  //       req.flash('error_msg', 'Cập nhật học kỳ thất bại!');
  //       return res.redirect('/semester');
  //     }
  //     return res.status(500).send("Cập nhật học kỳ thất bại!");
  //   }
  // }

  async getSemester(req, res) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) return res.render("auth/login");

      const user = await User.findById(userId).lean();

      // 1️⃣ Lấy tất cả học kỳ + score + course
      const semesterDocs = await Semester.find({ user: userId })
        .populate({
          path: "score",
          populate: { path: "HocPhan" }
        })
        .lean();

      // 2️⃣ Nhóm score theo học kỳ
      const classesGroupedBySemester = semesterDocs.map(sem => ({
        _id: sem._id,
        tenHocKy: sem.tenHocKy,
        namHoc: sem.namHoc,
        scores: sem.score || []
      }));

      // 3️⃣ Lấy tất cả Course chưa thuộc học kỳ nào
      const usedCourseIds = await Score.find({
        user: userId,
        semester: { $ne: null }
      }).distinct("HocPhan");

      const availableCourses = await Course.find({
        user: userId,
        _id: { $nin: usedCourseIds }
      }).lean();

      // 4️⃣ Lấy score mồ côi
      const orphanScores = await Score.find({
        user: userId,
        $or: [{ semester: null }, { semester: { $exists: false } }]
      })
        .populate("HocPhan")
        .lean();

      // 5️⃣ Render
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

  //ok
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

    // 1️⃣ Tạo Semester mới cho người dùng
    const newSemester = await Semester.create({
      tenHocKy,
      namHoc,
      user: userId,
      score: [],
    });

    const scoreIds = [];

    // 2️⃣ Tạo hoặc cập nhật Score tương ứng với từng Course
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

    // 3️⃣ Thêm danh sách Score vào Semester
    newSemester.score = scoreIds;
    await newSemester.save();

    // 4️⃣ Gửi thông báo (nếu bạn dùng Notification)
    await Notification.create({
      recipient: userId,
      sender: userId,
      type: "success",
      title: "Thêm học kỳ mới",
      message: `Bạn đã thêm học kỳ "${tenHocKy}" (${namHoc}) thành công.`,
      relatedModel: "Semester",
      relatedId: newSemester._id,
    });

    // 5️⃣ Trả về dữ liệu đã populate
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
    console.error("❌ Lỗi khi thêm học kỳ:", error);
    res.status(500).json({ message: "❌ Lỗi server khi thêm học kỳ." });
  }
}

async getEditSemesterForm(req, res) {
  try {
    const userId = req.session?.user?._id;
    const semesterId = req.params.id;

    const user = await User.findById(userId).lean();

    // 1️⃣ Lấy học kỳ + score
    const semester = await Semester.findOne({
      _id: semesterId,
      user: userId
    })
      .populate({
        path: "score",
        populate: { path: "HocPhan" }
      })
      .lean();

    if (!semester) return res.status(404).send("Không tìm thấy học kỳ");

    semester.score = semester.score.filter(s => s && s.HocPhan);

    // 2️⃣ Lấy tất cả Course
    const allCourses = await Course.find({ user: userId }).lean();

    // 3️⃣ Score thuộc học kỳ khác
    const scoresOther = await Score.find({
      user: userId,
      semester: { $nin: [null, semesterId] }
    }).lean();

    const excludedCourseIds = new Set(
      scoresOther
        .map(s => s.HocPhan?.toString())
        .filter(Boolean)
    );

    // 4️⃣ Map score thuộc học kỳ hiện tại
    const scoreMap = {};
    semester.score.forEach(s => {
      scoreMap[s.HocPhan._id.toString()] = s;
    });

    // 5️⃣ Tạo danh sách hiển thị
    const courseList = allCourses
      .filter(c => {
        const cid = c._id.toString();

        // ❌ Bị khóa bởi học kỳ khác → ẩn
        if (excludedCourseIds.has(cid)) return false;

        // ✔ Thuộc học kỳ hiện tại → hiển thị và tick
        if (scoreMap[cid]) return true;

        // ✔ Course mới → hiển thị
        return true;
      })
      .map(c => {
        const cid = c._id.toString();
        const sc = scoreMap[cid];

        return {
          courseId: cid,
          scoreId: sc?._id?.toString() || null,
          HocPhan: c,
          isSelected: !!sc
        };
      });

    // 6️⃣ Render
    res.render("user/editSemester", {
      user,
      semester,
      courseList
    });

  } catch (err) {
    console.error("❌ Lỗi getEditSemesterForm:", err);
    res.status(500).send("Lỗi server!");
  }
}


//ok
async updateSemester(req, res) {
  try {
    const userId = req.session?.user?._id;
    const semesterId = req.params.id;

    const { tenHocKy, namHoc, selectedItems } = req.body;

    // selectedItems có thể là 1 value hoặc array
    const selectedCourses = Array.isArray(selectedItems)
      ? selectedItems
      : selectedItems ? [selectedItems] : [];

    console.log("▶ Selected Courses:", selectedCourses);

    const semester = await Semester.findOne({ _id: semesterId, user: userId })
      .populate("score")
      .exec();

    if (!semester) {
      return res.status(404).send("Không tìm thấy học kỳ");
    }

    const newScoreIds = [];

    // 1️⃣ XỬ LÝ TẤT CẢ COURSE ĐƯỢC TICK
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

    // 2️⃣ BỎ TICK → GỠ KHỎI HỌC KỲ
    await Score.updateMany(
      {
        user: userId,
        semester: semesterId,
        HocPhan: { $nin: selectedCourses }
      },
      { $set: { semester: null } }
    );

    // 3️⃣ CẬP NHẬT LẠI SEMESTER
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
    console.error("❌ Lỗi updateSemester:", err);
    return res.status(500).send("Cập nhật học kỳ thất bại!");
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


}

module.exports = new SemesterController();
