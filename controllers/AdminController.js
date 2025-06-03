const User = require('../models/User');

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
        const users = await User.find();
        res.render('admin/courses', {
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

}

module.exports = new AdminController();
