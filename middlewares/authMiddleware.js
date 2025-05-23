function checkLogin(req, res, next) {
    if (req.session && req.session.user) {
        next(); // Cho phép đi tiếp
    } else {
        return res.render('login'); 
    }
}

module.exports = { checkLogin };
