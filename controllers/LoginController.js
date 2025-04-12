
const User = require('../models/User');
const { mongooseToObject } = require('../src/util/mongoose');

class LoginController {
    index(req, res) {
        res.render('login', {layout: "auth", error: null });
    }

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect("/login",);
        });
    }

    showResetPassword(req, res) {
        res.render('reset-password', {layout: "auth", messages: {} });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password);
    
            const user = await User.findOne({ username });
            console.log("User tìm thấy:", user);
    
            if (!user) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/login');
            }
    
            if (user.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/login');
            }
    
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar
            };
            req.session.userId = user._id;
            console.log("Lưu session:", req.session.user);
    
            res.redirect("/account");
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
                return res.render('reset-password', { messages: { error: "Tài khoản không tồn tại!" } });
            }

            // Cập nhật mật khẩu
            user.password = newPassword;
            await user.save({ validateBeforeSave: false });
            res.redirect('/login?message=Đổi mật khẩu thành công');

        } catch (error) {
            console.error("Lỗi khi cập nhật mật khẩu:", error);
            res.render('reset-password', { messages: { error: 'Có lỗi xảy ra khi cập nhật mật khẩu!' } });
        }
    }
    
}

module.exports = new LoginController();
