const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    youtubeId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
    daXoa: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Video', videoSchema);
