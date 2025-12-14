const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    role: { type: String, default: 'admin' },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: '/img/avatar-admin.png' },  
    createdAt: { type: Date, default: Date.now }
});

//  Dùng chung collection "users":
module.exports = mongoose.model('Admin', adminSchema, 'users');
