const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  maHocPhan: { type: String, required: true, unique: true },
  tenHocPhan: { type: String, required: true},
  soTinChi: {type: Number, required: true },
  daXoa: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Course', courseSchema);
