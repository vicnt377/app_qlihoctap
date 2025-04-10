const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  stt: {type: Number},
  maHocPhan: { type: String, required: true, unique: true },
  tenHocPhan: { type: String, required: true},
  soTinChi: {type: Number, required: true }
});

module.exports = mongoose.model('Course', courseSchema);
