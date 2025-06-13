const User = require('../models/User');
const Course = require('../models/Course');

class AdminController {
    async dashboard(req, res) {
        res.render('admin/dashboard', { 
            user: req.session.user,
            layout: 'auth',
        });
    }

    async users(req, res) {
        const users = await User.find();
        res.render('admin/users', {
            user: req.session.user,
            users,
            layout: 'auth',
        });
    }

    async courses(req, res) {
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

}

module.exports = new AdminController();
