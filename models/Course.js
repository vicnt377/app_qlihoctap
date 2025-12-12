const mongoose = require('mongoose');
const User = require('./User');

const courseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maHocPhan: { type: String, required: true },
  tenHocPhan: { type: String, required: true },
  soTinChi: { type: Number, required: true },
}, { timestamps: true });

// Unique index theo user + maHocPhan
courseSchema.index({ user: 1, maHocPhan: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
