const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

class UserController {
    async getUsers(req, res) {
        try {
            const { search, status } = req.query;
    
            let filter = { role: 'user' };
    
            if (search) {
                const regex = new RegExp(search, 'i');
                filter.$or = [{ username: regex }, { email: regex }];
            }
    
            // Giả sử bạn lưu trạng thái người dùng theo logic riêng (ví dụ: active = true/false)
            if (status === 'active') filter.isActive = true;
            else if (status === 'inactive') filter.isActive = false;
    
            // Truy vấn danh sách học viên
            const allUsers = await User.find(filter);
    
            // Xây dựng mảng học viên
            const students = allUsers.map(user => ({
                _id: user._id,
                name: user.username,
                email: user.email,
                createdAt: user.createdAt,
                isActive: user.isActive ?? true, // fallback nếu chưa có trường isActive
                stats: {
                    avgProgress: Math.floor(Math.random() * 100),
                    completedCourses: Math.floor(Math.random() * 10),
                }
            }));
    
            const now = new Date();
            const studentStats = {
                total: students.length,
                active: students.filter(s => s.isActive).length,
                newThisMonth: students.filter(s => {
                    const d = new Date(s.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length,
                totalEnrollments: students.reduce((sum, s) => sum + s.stats.completedCourses, 0),
                };
    
            res.render('admin/users', {
                user: req.session.user,
                students,
                studentStats,
                layout: 'admin',
                query: { search, status }
            });
    
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi tải danh sách học viên');
        }
    }
}
module.exports = new UserController();