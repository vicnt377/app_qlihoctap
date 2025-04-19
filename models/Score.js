const mongoose = require('mongoose')
const Course = require('./Course')

const scoreSchema = new mongoose.Schema({
    HocPhan: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    diemSo: { type: String, required: false,},
    diemChu: { type: String, required: false, },

    gioHoc: { type: String,required: true, },
    thu: {type: String,required: true, }
}, { timestamps: true });


module.exports = mongoose.model('Score', scoreSchema);
