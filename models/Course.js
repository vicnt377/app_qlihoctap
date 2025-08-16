const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  maHocPhan: { type: String, required: true, unique: true },
  tenHocPhan: { type: String, required: true},
  soTinChi: {type: Number, required: true },
  chuongTrinhDaoTao: { 
    type: String, 
    required: true,
    enum: ['Công nghệ thông tin', 'Kỹ thuật điện', 'Kỹ thuật cơ khí', 'Kinh tế', 'Ngoại ngữ', 'Khác'],
    default: 'Công nghệ thông tin'
  },
  namNhapHoc: { 
    type: Number, 
    required: true,
    min: 2020,
    max: 2030,
    default: new Date().getFullYear()
  },
  hocKy: {
    type: String,
    required: true,
    enum: ['Học kỳ 1', 'Học kỳ 2', 'Học kỳ 3', 'Học kỳ 4', 'Học kỳ 5', 'Học kỳ 6', 'Học kỳ 7', 'Học kỳ 8'],
    default: 'Học kỳ 1'
  },
  moTa: { type: String, default: '' },
  daXoa: {
    type: Boolean,
    default: false
  },
  importedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  importedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
courseSchema.index({ chuongTrinhDaoTao: 1, namNhapHoc: 1, hocKy: 1 });
courseSchema.index({ tenHocPhan: 1 });

module.exports = mongoose.model('Course', courseSchema);
