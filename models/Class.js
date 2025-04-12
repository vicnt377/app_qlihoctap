const mongoose = require('mongoose')
const Course = require('./Course')

const classSchema = new mongoose.Schema({
    
    HocPhan: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    thu: {type: String, required: true,},
    gioHoc: { type: String, required: true,},
}, { timestamps: true });


module.exports = mongoose.model('Class', classSchema);
