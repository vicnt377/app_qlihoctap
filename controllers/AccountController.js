const User = require('../models/User');
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
            
            const { username, email, phone, password } = req.body;
            let updateData = {};

            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;
            if (username) updateData.username = username;
            if (password) updateData.password = password;

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
            req.session.save(err => {
                if (err) {
                    console.error('Lỗi khi lưu session:', err);
                }

                res.render('account', {
                    user: updatedUser.toObject(),
                    successMessage: 'Cập nhật tài khoản thành công!',
                });
            });

        } catch (err) {
            console.error('Update profile error:', err);
            res.status(500).send('Có lỗi xảy ra khi cập nhật hồ sơ');
        }
    }
}

module.exports = new AccountController();
