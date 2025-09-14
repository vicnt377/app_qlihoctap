const mongoose = require('mongoose');
const User = require('./User');

const documentSchema = new mongoose.Schema({
  username: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  title: { type: String, required: true },
  file: { type: String, required: true }, // đường dẫn lưu file
  originalName: { type: String, required: true }, // tên file gốc (VD: báo cáo.docx)
  fileType: { type: String, required: true }, // đuôi file (pdf/docx/xlsx/...)
  fileSize: { type: Number, required: true }, // dung lượng file (bytes)
  previewFile: { type: String, default: null },
  converted: { type: Boolean, default: false }
}, {
  timestamps: true // tự động thêm createdAt và updatedAt
});

// Index cho tìm kiếm nhanh
documentSchema.index({ username: 1, visibility: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
