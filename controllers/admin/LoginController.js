const Admin = require('../../models/Admin');

class LoginController {

    login_admin(req, res) {
        res.render('auth/login-admin', { layout: "auth", error: null });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password);

            const admin = await Admin.findOne({ username });
            console.log("Admin tìm thấy:", admin);

            // ❌ Sai mật khẩu hoặc không tồn tại
            if (!admin || admin.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/admin/login-admin');
            }

            // ❌ Kiểm tra role
            if (admin.role !== 'admin') {
                req.flash('error_msg', 'Bạn không có quyền truy cập trang quản trị!');
                return res.redirect('/admin/login-admin');
            }

            // ⭐ Lưu session đúng chuẩn
            req.session.user = {
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                phone: admin.phone,
                avatar: admin.avatar,
                role: admin.role
            };

            req.session.userId = admin._id;

            console.log("Lưu session:", req.session.user);

            return res.redirect('/admin/dashboard');

        } catch (error) {
            console.error("Lỗi server:", error);
            return res.status(500).send("Lỗi máy chủ!");
        }
    }
}

module.exports = new LoginController();
