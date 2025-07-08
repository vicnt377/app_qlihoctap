const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    youtubeId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    thumbnail: { type: String, default: 'default.jpg' }, // ảnh thumbnail trong thư mục public/img/thumbnails
    category: { type: String, default: 'Khác' }, // ví dụ: "Lập trình", "Backend"
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    duration: { type: Number, default: 1 }, // đơn vị: giờ
    lessons: { type: Number, default: 1 },
    instructor: { type: String, default: 'Chưa cập nhật' },
    createdAt: { type: Date, default: Date.now },
    daXoa: { type: Boolean, default: false },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }]

});

module.exports = mongoose.model('Video', videoSchema);
