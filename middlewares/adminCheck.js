function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.render('auth/login-admin', {layout: 'auth'})
  }
}

module.exports = { isAdmin };