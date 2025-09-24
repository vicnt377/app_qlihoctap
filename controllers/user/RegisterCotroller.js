const User = require('../../models/User');
const { mongooseToObject } = require('../../src/util/mongoose');

class RegisterController{
    index(req, res, next){
        res.render('auth/register',{ layout: "auth" });
    }
    async register(req, res) {
    try {
        const { username, email, password, confirmPassword, phone, major, totalCredits } = req.body;

        if (password !== confirmPassword) {
        return res.render('auth/register', { layout: "auth", error: "Mật khẩu xác nhận không khớp!" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
        return res.render('auth/register', { layout: "auth", error: "Tên đăng nhập đã tồn tại!" });
        }

        const newUser = new User({ username, email, password, phone, major, totalCredits });
        await newUser.save();

        req.flash('success_msg', 'Đăng ký thành công! Hãy đăng nhập.');
        res.redirect('/login-user');
    } catch (error) {
        console.error("Lỗi server:", error);
        res.status(500).send("Lỗi máy chủ!");
    }
    }

}

module.exports = new RegisterController();