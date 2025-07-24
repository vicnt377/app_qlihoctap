const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

class LoginController {

    login_admin(req, res) {
        res.render('auth/login-admin', {layout: "auth", error: null });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password);

            const user = await User.findOne({ username });
            console.log("User tìm thấy:", user);

            if (!user || user.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/admin/login-admin');
            }

            if (user.role !== 'admin') {
            req.flash('error_msg', 'Bạn không có quyền truy cập trang quản trị!');
            return res.redirect('/admin/login-admin');
            }
            // Lưu session
            req.session.user = {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role
            };
            req.session.userId = user._id;
            console.log("Lưu session:", req.session.user);

            res.redirect('/admin/dashboard');

        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).send("Lỗi máy chủ!");
        }
    }

}

module.exports = new LoginController();