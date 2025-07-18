function isUser(req, res, next) {
  if (req.session && req.session.user) return next();

  if (req.xhr || req.headers.accept.includes('json')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  return res.redirect('/login-user');
}

module.exports = { isUser };