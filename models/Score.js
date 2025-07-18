const mongoose = require('mongoose')
const Course = require('./Course')
const User = require('./User')
const Semester = require('./Semester')

const scoreSchema = new mongoose.Schema({
    username: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    HocPhan: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    diemSo: { type: String, required: false,},
    diemChu: { type: String, required: false, },
    gioBatDau: { type: String,required: true, },
    gioKetThuc: { type: String,required: true, },
    thu: {type: String,required: true, },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' }
}, { timestamps: true });


module.exports = mongoose.model('Score', scoreSchema);
