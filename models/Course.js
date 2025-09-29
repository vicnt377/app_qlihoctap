const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maHocPhan: { type: String, required: true, unique: true },
  tenHocPhan: { type: String, required: true},
  soTinChi: {type: Number, required: true },
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
courseSchema.index({ tenHocPhan: 1 });

// Đảm bảo mỗi user chỉ có 1 học phần với mã này
courseSchema.index({ user: 1, maHocPhan: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
