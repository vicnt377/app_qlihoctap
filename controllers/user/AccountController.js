const User = require('../../models/User');
const Notification = require('../../models/Notification');
const path = require('path');


class AccountController {
    index(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login'); 
        }

        res.render('user/account', {
            user: req.session.user, 
        });
    }

    async updateProfile(req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
            }

            const userId = req.session.user._id;
            
            const { username, email, phone } = req.body;
            let updateData = {};

            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;
            if (username) updateData.username = username;

            if (req.file) {
                const ext = path.extname(req.file.originalname);
                const avatarPath = '/img/' + req.session.user._id + ext;
                updateData.avatar = avatarPath;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).send('User không tồn tại.');
            }

            // Cập nhật session chỉ với các trường đã thay đổi
            req.session.user = {
                ...req.session.user,
                ...updateData
            };

            // Ghi đè session và đảm bảo được lưu
            req.session.save(async (err) => {
            if (err) {
                console.error('Lỗi khi lưu session:', err);
            }

            // ✅ Tạo thông báo cập nhật hồ sơ
            try {
                const profileNotification = new Notification({
                recipient: userId,
                sender: userId,
                type: 'success',
                title: 'Cập nhật hồ sơ thành công',
                message: `Thông tin tài khoản của bạn đã được cập nhật.`,
                relatedModel: 'User',
                relatedId: updatedUser._id,
                isRead: false,
                metadata: {
                    action: 'updateProfile',
                    timestamp: new Date()
                }
                });

                await profileNotification.save();
                if (req.io) {
                req.io.to(userId.toString()).emit('new-notification', profileNotification);
                }
            } catch (notifyErr) {
                console.error("❌ Lỗi tạo thông báo updateProfile:", notifyErr);
            }

            // Trả về view
            res.render('user/account', {
                user: updatedUser.toObject(),
                // successMessage: 'Cập nhật tài khoản thành công!',
            });
            });

        } catch (err) {
            console.error('Update profile error:', err);
            res.status(500).send('Có lỗi xảy ra khi cập nhật hồ sơ');
        }
    }

    async updatePassword(req, res) {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user?._id;

        try {
            if (!userId) {
                req.session.errorMessage = 'Không xác định được người dùng!';
                return res.redirect('/account');
            }

            if (!currentPassword || !newPassword || !confirmPassword) {
                req.session.errorMessage = 'Vui lòng điền đầy đủ các trường!';
                return res.redirect('/account');
            }

            if (newPassword !== confirmPassword) {
                req.session.errorMessage = 'Mật khẩu xác nhận không khớp!';
                return res.redirect('/account');
            }

            const user = await User.findById(userId);
            if (!user) {
                req.session.errorMessage = 'Không tìm thấy người dùng!';
                return res.redirect('/account');
            }

            // So sánh mật khẩu hiện tại (không hash)
            if (currentPassword !== user.password) {
                req.session.errorMessage = 'Mật khẩu hiện tại không đúng!';
                return res.redirect('/account');
            }

            // Cập nhật mật khẩu mới
            user.password = newPassword;

            // Lưu lại user (không cần updateOne)
            await user.save({ validateBeforeSave: false });
            
            // ✅ Tạo thông báo đổi mật khẩu
            try {
            const passwordNotification = new Notification({
                recipient: userId,
                sender: userId,
                type: 'info',
                title: 'Đổi mật khẩu thành công',
                message: `Bạn vừa đổi mật khẩu tài khoản.`,
                relatedModel: 'User',
                relatedId: user._id,
                isRead: false,
                metadata: {
                action: 'updatePassword',
                timestamp: new Date()
                }
            });

            await passwordNotification.save();
            if (req.io) {
                req.io.to(userId.toString()).emit('new-notification', passwordNotification);
            }
            } catch (notifyErr) {
            console.error("❌ Lỗi tạo thông báo updatePassword:", notifyErr);
            }

            req.session.successMessage = 'Đổi mật khẩu thành công!';
            return res.redirect('/account');
        } catch (err) {
            console.error('Lỗi đổi mật khẩu:', err);
            req.session.errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu!';
            return res.redirect('/account');
        }
    }

    

}

module.exports = new AccountController();
