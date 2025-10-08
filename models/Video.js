const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    youtubeId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    thumbnail: { type: String, default: 'default.jpg' }, // ảnh thumbnail trong thư mục public/img/thumbnails
    category: {
        type: String,
        enum: ['CNTT', 'YT', 'GD', 'NN', 'KT-TC', 'TN-MT', 'KD-QL', 'KT-XD', 'L-NV', 'ST-NT', 'DV-DL' ],
    },
    duration: { type: String, },
    students: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    
    daXoa: { type: Boolean, default: false },
    
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', videoSchema);
