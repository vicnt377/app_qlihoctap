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

            if (status === 'active') filter.isActive = true;
            else if (status === 'inactive') filter.isActive = false;

            // Truy vấn danh sách học viên
            const allUsers = await User.find(filter);

            // Xây dựng mảng học viên (đúng field với modal)
            const students = allUsers.map(user => ({
                _id: user._id,
                name: user.username,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                createdAt: user.createdAt,
                isActive: user.isActive ?? true,
                major: user.major,       // ✅ thêm ngành học
                totalCredits: user.totalCredits,   // ✅ thêm tín chỉ
            }));

            const now = new Date();
            const studentStats = {
                total: students.length,
                active: students.filter(s => s.isActive).length,
                newThisMonth: students.filter(s => {
                    const d = new Date(s.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length,
            };

            res.render('admin/users', {
                user: req.session.user,
                students,
                studentStats,
                success: req.flash('success'),
                layout: 'admin',
                query: { search, status }
            });

        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi tải danh sách học viên');
        }
    }

    async clockUser(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
            return res.status(404).send("Không tìm thấy người dùng");
            }

            // Toggle trạng thái bằng cách gán ngược lại
            const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: !user.isActive },
            { new: true } // Trả về bản ghi đã cập nhật
            );

            console.log(`🛠️ Toggle trạng thái user: ${updatedUser._id} => ${updatedUser.isActive ? 'Hoạt động' : 'Đã khóa'}`);
            res.redirect('/admin/users'); // hoặc route phù hợp
        } catch (error) {
            console.error("❌ Lỗi server khi toggle trạng thái:", error);
            res.status(500).send("Lỗi máy chủ");
        }
    }

    async addUser(req, res) {
        try {
            const { name, email, phone, password, confirmPassword, avatar, major, totalCredits } = req.body;
            
            // Validation cơ bản
            if (!name || !email || !password || !major) {
                req.flash('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                return res.redirect('/admin/users');
            }
            if (password !== confirmPassword) {
                req.flash('error', 'Mật khẩu và xác nhận mật khẩu không khớp');
                return res.redirect('/admin/users');
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                req.flash('error', 'Email đã tồn tại');
                return res.redirect('/admin/users');
            }

            // Tạo user mới
            const user = await User.create({
                username: name,
                email,
                phone: phone || '',
                password, 
                avatar: avatar && avatar.trim() ? avatar.trim() : '/img/avatar.png',
                role: 'user',
                major,
                totalCredits: totalCredits ? Number(totalCredits) : 0,
                isActive: true
            });

            console.log(`✅ Thêm học viên mới: ${user.username} (${user.email})`);
            req.flash('success', 'Thêm học viên mới thành công!');
            res.redirect('/admin/users');
        } catch (error) {
            console.error("❌ Lỗi server khi thêm học viên:", error);
            req.flash('error', 'Lỗi máy chủ khi thêm học viên');
            res.redirect('/admin/users');
        }
    }


    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            console.log('🗑️ Yêu cầu xóa user:', id);

            // Kiểm tra user có tồn tại không
            const user = await User.findById(id);
            if (!user) {
                console.log('❌ User không tồn tại:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy học viên'
                });
            }

            // Kiểm tra user có phải admin không (không cho phép xóa admin)
            if (user.role === 'admin') {
                console.log('❌ Không thể xóa admin:', id);
                return res.status(403).json({
                    success: false,
                    message: 'Không thể xóa tài khoản admin'
                });
            }

            // Xóa user
            await User.findByIdAndDelete(id);
            
            console.log(`✅ Xóa user thành công: ${user.email}`);
            
            res.json({
                success: true,
                message: 'Xóa học viên thành công'
            });
            
        } catch (error) {
            console.error("❌ Lỗi server khi xóa học viên:", error);
            res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ khi xóa học viên'
            });
        }
    }
}
module.exports = new UserController();