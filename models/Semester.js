const mongoose = require('mongoose')
const Course = require('./Course')
const Score = require("./Score")
const User = require('./User')

const semesterSchema = new mongoose.Schema({
    tenHocKy: { type: String, required: true }, 
    namHoc: { type: String, required: true },
    score: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Score',}],
    username: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });


module.exports = mongoose.model('Semester', semesterSchema);
