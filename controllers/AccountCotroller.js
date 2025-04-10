const User = require('../models/User')

class AccountController {
    index(req, res, next) {
        if (!req.session.user) {
            return res.redirect('/login',); 
        }

        res.render('account', {
            user: req.session.user, 
        });
    }

    async updateProfile(req, res) {
        
    }
    
}


module.exports = new AccountController();
