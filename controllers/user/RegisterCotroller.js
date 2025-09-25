const User = require('../../models/User');

class RegisterController {
  index(req, res, next) {
    res.render('auth/register', { layout: "auth" });
  }

  async register(req, res) {
    try {
      const { username, email, password, confirmPassword, phone, major, totalCredits } = req.body;

      // ✅ Kiểm tra mật khẩu nhập lại
      if (password !== confirmPassword) {
        return res.render('auth/register', { layout: "auth", error: "Mật khẩu xác nhận không khớp!" });
      }

      // ✅ Kiểm tra trùng tên đăng nhập
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.render('auth/register', { layout: "auth", error: "Tên đăng nhập đã tồn tại!" });
      }

      // ✅ Tạo user mới
      const newUser = new User({ username, email, password, phone, major, totalCredits });
      await newUser.save();

      // ✅ Tự động đăng nhập (lưu session)
      req.session.user = {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        phone: newUser.phone,
        major: newUser.major,
        totalCredits: newUser.totalCredits
      };

      // ✅ Lưu session và redirect
      req.session.save(async (err) => {
        if (err) {
          console.error("❌ Lỗi khi lưu session sau đăng ký:", err);
          return res.redirect('/login-user');
        }

        // 🔔 Tạo notification chào mừng
        try {
          const Notification = require('../../models/Notification');
          const welcomeNotification = new Notification({
            recipient: newUser._id,
            sender: newUser._id,
            type: 'welcome',
            title: 'Chào mừng bạn!',
            message: `Tài khoản "${newUser.username}" đã được tạo thành công. Chúc bạn có một quá trình học tập vui vẻ 🎉`,
            relatedModel: 'User',
            relatedId: newUser._id,
            isRead: false,
            metadata: {
              action: 'register',
              timestamp: new Date()
            }
          });
          await welcomeNotification.save();

          if (req.io) {
            req.io.to(newUser._id.toString()).emit('new-notification', welcomeNotification);
          }
        } catch (notifyErr) {
          console.error("❌ Lỗi tạo thông báo đăng ký:", notifyErr);
        }

        req.session.showCongrats = true;
        req.session.congratsMessage = `🎉 Chúc mừng ${newUser.username}! Bạn đã đăng ký thành công.`;
        return res.redirect('/home');
      });

    } catch (error) {
      console.error("Lỗi server:", error);
      res.status(500).send("Lỗi máy chủ!");
    }
  }
}

module.exports = new RegisterController();
