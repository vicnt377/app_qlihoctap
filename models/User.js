const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    email: {type: String,required: true,  },
    avatar: { type: String, default: '/img/images2.jpg' },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },

    enrolledVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]

});


module.exports = mongoose.model('User', userSchema)
