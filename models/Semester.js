const mongoose = require('mongoose');
const User = require('../models/User')
const Score = require('../models/Score')

const semesterSchema = new mongoose.Schema({
  tenHocKy: { type: String, required: true },
  startDate: { type: Date, required: true },
  soTuan: { type: Number, default: 18 }, // Số tuần học mặc định 18
  endDate: { type: Date }, // Tự tính, không cần nhập từ form
  score: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Score' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Hook để tính endDate tự động trước khi lưu
semesterSchema.pre('save', function (next) {
  if (this.startDate && this.soTuan) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    this.endDate = new Date(this.startDate.getTime() + (this.soTuan * msPerWeek));
  }
  next();
});

module.exports = mongoose.model('Semester', semesterSchema);
