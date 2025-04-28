function checkLogin(req, res, next) {
    if (req.session && req.session.user) {
        next(); // Cho phép đi tiếp
    } else {
        res.status(401).send('Bạn chưa đăng nhập!');
    }
}

module.exports = { checkLogin };
