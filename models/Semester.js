const mongoose = require('mongoose');
const User = require('../models/User')
const Score = require('../models/Score')

const semesterSchema = new mongoose.Schema({
  tenHocKy: { type: String, required: true },
  namHoc: { type: String, required: true },
  score: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Score' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });



module.exports = mongoose.model('Semester', semesterSchema);
