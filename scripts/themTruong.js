const mongoose = require('mongoose');
const Course = require('../models/Course'); // chỉnh path nếu cần

// ===== KẾT NỐI DB =====
mongoose.connect('mongodb://127.0.0.1:27017/quanlitiendo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateCourses() {
  try {
    const result = await Course.updateMany(
      {
        $or: [
          { maHocPhan: { $regex: /^(TC|XH|FL|QP)/i } },
          { maHocPhan: { $regex: /TH/i } },
          { tenHocPhan: { $regex: /tin học/i } },
        ],
      },
      {
        $set: { laHocPhanDieuKien: true },
      }
    );

    console.log('✅ Cập nhật thành công');
    console.log('Số học phần được cập nhật:', result.modifiedCount);

  } catch (error) {
    console.error('❌ Lỗi cập nhật:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateCourses();
