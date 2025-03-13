const User = require('../models/User');
const { mongooseToObject } = require('../src/util/mongoose');

class RegisterController{
    index(req, res, next){
        res.render('register')
    }
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            console.log("Dữ liệu nhận được:", username, email, password);

            // Kiểm tra tài khoản đã tồn tại chưa
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                console.log("Tên đăng nhập đã tồn tại!");
                return res.render('register', { error: "Tên đăng nhập đã tồn tại!" });
            }

            // Lưu người dùng vào database
            const newUser = new User({ username, email, password });
            await newUser.save();

            // Thêm thông báo thành công
            req.flash('success_msg', 'Đăng ký thành công! Hãy đăng nhập.');
            res.redirect('/login'); 
        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).send("Lỗi máy chủ!");
        }
    }
}

module.exports = new RegisterController();