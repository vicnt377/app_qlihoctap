
const User = require('../../models/User');
const { mongooseToObject } = require('../../src/util/mongoose');

class LoginController {
    re_login(req, res){
        res.render('auth/re-login', {layout: "auth", error: null });
    }

    

    login_user(req, res) {
        res.render('auth/login', {layout: "auth", error: null });
    }

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect("/",);
        });
    }

    showResetPassword(req, res) {
        res.render('auth/reset-password', {layout: "auth", messages: {} });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password);

            const user = await User.findOne({ username });
            console.log("User tìm thấy:", user);

            if (!user || user.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/login-user');
            }

            // ✅ Kiểm tra trạng thái tài khoản
            if (!user.isActive) {
                req.flash('error_msg', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!');
                return res.redirect('/login-user');
            }

            // ✅ Chỉ cho phép user có role là "user" đăng nhập
            if (user.role !== 'user') {
                req.flash('error_msg', 'Bạn không có quyền truy cập vào hệ thống người dùng!');
                return res.redirect('/login-user');
            }

            // ✅ Lưu session
            req.session.user = {
                _id: user._id.toString(),
                username: user.username,
                avatar: user.avatar,
                role: user.role
            };
            req.session.userId = user._id;
            console.log("Lưu session:", req.session.user);

            res.redirect('/home');

        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).send("Lỗi máy chủ!");
        }
    }



    async updatePassword(req, res) {
        const { username, newPassword } = req.body;

        try {
            // Tìm user theo username
            const user = await User.findOne({ username });
            if (!user) {
                return res.render('auth/reset-password', { messages: { error: "Tài khoản không tồn tại!" } });
            }

            // Cập nhật mật khẩu
            user.password = newPassword;
            await user.save({ validateBeforeSave: false });
            res.redirect('/login?message=Đổi mật khẩu thành công');

        } catch (error) {
            console.error("Lỗi khi cập nhật mật khẩu:", error);
            res.render('auth/reset-password', { messages: { error: 'Có lỗi xảy ra khi cập nhật mật khẩu!' } });
        }
    }
    
}

module.exports = new LoginController();
