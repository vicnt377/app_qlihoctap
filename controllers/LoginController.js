
const User = require('../models/User');
const { mongooseToObject } = require('../src/util/mongoose');

class LoginController {
    index(req, res) {
        res.render('login', { error: null });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password); // Debug

            const user = await User.findOne({ username });
            console.log("User tìm thấy:", user); // Debug

            if (!user) {
                console.log("Không tìm thấy user!");
                return res.render('login', { error: "Tên đăng nhập hoặc mật khẩu không đúng!" });
            }

            req.session.user = mongooseToObject(user);
            console.log("Lưu session:", req.session.user); // Debug

            res.redirect('/home');
        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).send("Lỗi máy chủ!");
        }
    }
}

module.exports = new LoginController();
