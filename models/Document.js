const mongoose = require('mongoose');
const User = require('./User')

const documentSchema = new mongoose.Schema({
    username: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    file: { type: String, required: true }, // Không unique
    createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true // giúp lưu createdAt và updatedAt
});

module.exports = mongoose.model('Document', documentSchema);
