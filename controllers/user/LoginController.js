
const User = require('../../models/User');
const Notification = require('../../models/Notification')
const { mongooseToObject } = require('../../src/util/mongoose');
const sendMail = require('../../config/mail/mail');
const MailTemplate = require('../../src/util/emailTemplates');


class LoginController {
    re_login(req, res){
        res.render('auth/re-login', {layout: "auth", error: null, bodyClass: 'landing-page' });
    }

    login_user(req, res) {
        res.render('auth/login', {layout: "auth", error: null });
    }

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect("/login-user");
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

            //  Kiểm tra trạng thái tài khoản
            if (!user.isActive) {
                req.flash('error_msg', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!');
                return res.redirect('/login-user');
            }

            //  Chỉ cho phép user có role là "user" đăng nhập
            if (user.role !== 'user') {
                req.flash('error_msg', 'Bạn không có quyền truy cập vào hệ thống người dùng!');
                return res.redirect('/login-user');
            }

            //  Lưu session
            req.session.user = {
                _id: user._id, // Giữ nguyên ObjectId
                username: user.username,
                avatar: user.avatar,
                role: user.role
            };
            req.session.userId = user._id;
            console.log("Lưu session:", req.session.user);

            //  Tạo thông báo chào mừng sử dụng model đầy đủ
            try {
                const welcomeNotification = new Notification({
                    recipient: user._id, // Sử dụng recipient thay vì userId
                    sender: user._id, // Sử dụng sender
                    type: 'welcome', // Loại thông báo
                    title: 'Chào mừng trở lại!', //  Thêm title
                    message: `Chào mừng ${user.username} đăng nhập vào hệ thống học tập! Chúc bạn có một ngày học hiệu quả.`,
                    relatedModel: 'System', // Model liên quan
                    relatedId: null, // Không có ID cụ thể
                    isRead: false,
                    metadata: {
                        action: 'login',
                        timestamp: new Date()
                    }
                });
                
                await welcomeNotification.save();
                console.log("Đã tạo thông báo chào mừng cho user:", user.username);
                
                // Log thông báo đã tạo
                console.log(" Thông báo chào mừng:", {
                    id: welcomeNotification._id,
                    recipient: welcomeNotification.recipient,
                    title: welcomeNotification.title,
                    message: welcomeNotification.message
                });
                
            } catch (notificationError) {
                console.error("❌ Lỗi khi tạo thông báo chào mừng:", notificationError);
                // Không dừng quá trình đăng nhập nếu tạo thông báo thất bại
            }
            
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
                return res.render('auth/reset-password', { 
                    layout: "auth", 
                    messages: { error: "Tài khoản không tồn tại!" } });
            }

            // Cập nhật mật khẩu
            user.password = newPassword;
            await user.save({ validateBeforeSave: false });
            res.redirect('/login?message=Đổi mật khẩu thành công');

        } catch (error) {
            console.error("Lỗi khi cập nhật mật khẩu:", error);
            res.render('auth/reset-password', {
                layout: "auth",
                messages: { error: 'Có lỗi xảy ra khi cập nhật mật khẩu!' } });
        }
    }


}

module.exports = new LoginController();