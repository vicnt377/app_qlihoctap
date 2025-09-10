const mongoose = require('mongoose');
const User = require('./User')

const documentSchema = new mongoose.Schema({
    username: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    title: { type: String, required: true },
    file: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true // giúp lưu createdAt và updatedAt
});

module.exports = mongoose.model('Document', documentSchema);
