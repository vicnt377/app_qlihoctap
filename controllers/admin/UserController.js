const User = require('../../models/User');      // Model học viên
const Admin = require('../../models/Admin');    // Model admin (chung collection users)

class UserController {

    // 📌 Danh sách học viên
    async getUsers(req, res) {
        try {
            const { search, status } = req.query;

            let filter = { role: 'user' };   // ❗ Chỉ lấy học viên

            // Tìm kiếm
            if (search) {
                const regex = new RegExp(search, 'i');
                filter.$or = [{ username: regex }, { email: regex }];
            }

            // Lọc hoạt động / không hoạt động
            if (status === 'active') filter.isActive = true;
            else if (status === 'inactive') filter.isActive = false;

            const allUsers = await User.find(filter).lean();

            const students = allUsers.map(u => ({
                _id: u._id,
                name: u.username,
                email: u.email,
                phone: u.phone,
                avatar: u.avatar,
                createdAt: u.createdAt,
                isActive: u.isActive ?? true,
                major: u.major,
                totalCredits: u.totalCredits
            }));

            const now = new Date();
            const studentStats = {
                total: students.length,
                active: students.filter(s => s.isActive).length,
                newThisMonth: students.filter(s => {
                    const d = new Date(s.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length
            };

            res.render('admin/users', {
                user: req.session.user,
                students,
                studentStats,
                query: { search, status },
                layout: 'admin',
                success: req.flash('success'),
                error: req.flash('error')
            });

        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi tải danh sách học viên');
        }
    }


    // 📌 Khóa/Mở khóa học viên
    async clockUser(req, res) {
        try {
            const user = await User.findById(req.params.id);

            if (!user) return res.status(404).send("Không tìm thấy người dùng");

            if (user.role === 'admin') {
                console.log("❌ Không được khóa admin");
                return res.status(403).send("Không thể khóa tài khoản admin");
            }

            const updated = await User.findByIdAndUpdate(
                req.params.id,
                { isActive: !user.isActive },
                { new: true }
            );

            console.log(`🛠️ Đổi trạng thái user ${updated._id} → ${updated.isActive}`);

            res.redirect('/admin/users');

        } catch (error) {
            console.error("❌ Lỗi toggle:", error);
            res.status(500).send("Lỗi máy chủ");
        }
    }


    // 📌 Thêm học viên mới
    async addUser(req, res) {
        try {
            const { name, email, phone, password, confirmPassword, avatar, major, totalCredits } = req.body;

            // Validate
            if (!name || !email || !password || !major) {
                req.flash('error', 'Vui lòng điền đầy đủ thông tin');
                return res.redirect('/admin/users');
            }

            if (password !== confirmPassword) {
                req.flash('error', 'Mật khẩu không khớp');
                return res.redirect('/admin/users');
            }

            const existing = await User.findOne({ email });
            if (existing) {
                req.flash('error', 'Email đã tồn tại');
                return res.redirect('/admin/users');
            }

            await User.create({
                username: name,
                email,
                phone: phone || '',
                password,
                avatar: avatar?.trim() || '/img/avatar.png',
                role: 'user',
                major,
                totalCredits: totalCredits ? Number(totalCredits) : 0,
                isActive: true
            });

            req.flash('success', 'Thêm học viên thành công!');
            res.redirect('/admin/users');

        } catch (error) {
            console.error("❌ Lỗi thêm user:", error);
            req.flash('error', 'Lỗi máy chủ');
            res.redirect('/admin/users');
        }
    }


    // 📌 Xóa học viên
    async deleteUser(req, res) {
        try {
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({ success: false, message: "Không tìm thấy user" });
            }

            if (user.role === 'admin') {
                return res.status(403).json({ success: false, message: "Không thể xóa tài khoản admin" });
            }

            await User.findByIdAndDelete(req.params.id);

            return res.json({ success: true, message: "Xóa học viên thành công" });

        } catch (error) {
            console.error("❌ Lỗi xóa user:", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ" });
        }
    }

}

module.exports = new UserController();
