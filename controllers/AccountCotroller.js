const Account = require('../models/Account')

class AccountController{
    index(req, res, next){
        res.render('account')
    }
}

module.exports = new AccountController();