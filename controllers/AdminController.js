const User = require('../models/User');
const Course = require('../models/Course');

class AdminController {
    async dashboard(req, res) {
        res.render('admin/dashboard', { 
            user: req.session.user,
            layout: 'auth',
        });
    }

    
// Người dùng ------------------------------------------------------------------------------------------------------------------------------------
    async users(req, res) {
        const users = await User.find();
        res.render('admin/users', {
            user: req.session.user,
            users,
            layout: 'auth',
        });
    }

    async promoteUser(req, res) {
        try {
            const userId = req.params.id;
            await User.findByIdAndUpdate(userId, { role: 'admin' });
            res.redirect('/admin/users');
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi cấp quyền admin');
        }
    }


// Học Phần ---------------------------------------------------------------------------------------------------------------------------------------
    async getCourses(req, res) {
        try {
        const users = await User.find();
        const courses = await Course.find(); // Lấy tất cả học phần

        res.render('admin/courses', {
            user: req.session.user,
            users,
            courses: JSON.stringify(courses), // truyền vào view
            layout: 'auth'
        });
        } catch (err) {
        res.status(500).send('Lỗi server');
        }
    }

    async editCourse(req, res) {
        try {
            const { maHocPhan, tenHocPhan, soTinChi } = req.body;
            const { id } = req.params;

            await Course.findByIdAndUpdate(id, {
                maHocPhan,
                tenHocPhan,
                soTinChi,
            });

            res.sendStatus(200); // Thành công
        } catch (err) {
            console.error("Lỗi khi cập nhật học phần:", err);
            res.sendStatus(500); // Lỗi server
        }
    }


    async deleteCourse(req, res) {
        try {
            await Course.findByIdAndUpdate(req.params.id, { daXoa: true });
            res.sendStatus(200);
        } catch (err) {
            res.sendStatus(500);
        }
        }

    async restoreCourse(req, res) {
        try {
            const courseId = req.params.id;
            const updated = await Course.findByIdAndUpdate(courseId, { daXoa: false });

            if (!updated) {
            return res.status(404).send("Học phần không tồn tại");
            }

            res.status(200).send("Khôi phục thành công");
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khôi phục học phần");
        }
    }

    async createCourse(req, res) {
        try {
            const { maHocPhan, tenHocPhan, soTinChi } = req.body;

            // Kiểm tra đầu vào
            if (!maHocPhan || !tenHocPhan || !soTinChi) {
            return res.status(400).json({ message: 'Thiếu thông tin học phần.' });
            }

            // Kiểm tra trùng mã học phần
            const existed = await Course.findOne({ maHocPhan });
            if (existed) {
            return res.status(409).json({ message: 'Mã học phần đã tồn tại.' });
            }

            // Tạo học phần mới
            const newCourse = new Course({
            maHocPhan,
            tenHocPhan,
            soTinChi: Number(soTinChi),
            daXoa: false,
            });

            await newCourse.save();

            return res.status(201).json(newCourse);
        } catch (error) {
            console.error("Lỗi khi tạo học phần:", error);
            return res.status(500).json({ message: 'Lỗi server khi tạo học phần.' });
        }
    }

}

module.exports = new AdminController();
