const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: String,
  instructor: String,
  tinchi: Number
});

module.exports = mongoose.model('Course', courseSchema);
