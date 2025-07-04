function isUser(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') {
    next();
  } else {
    res.render('auth/login', {layout: 'auth'})
  }
}

module.exports = { isUser };