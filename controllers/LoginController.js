
const User = require('../models/User');
const { mongooseToObject } = require('../src/util/mongoose');

class LoginController {
    re_login(req, res){
        res.render('re-login', {layout: "auth", error: null });
    }

    login_admin(req, res) {
        res.render('login-admin', {layout: "auth", error: null });
    }

    login_user(req, res) {
        res.render('login', {layout: "auth", error: null });
    }

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect("/",);
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
                return res.redirect('/login-user');
            }
    
            if (user.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/login-user');
            }
    
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
    
            if (user.role === 'admin') {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/home');
            }

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
