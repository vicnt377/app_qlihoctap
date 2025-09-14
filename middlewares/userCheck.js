function isUser(req, res, next) {
  // Nếu đã đăng nhập và có user trong session
  if (req.session && req.session.user && req.session.user.role === 'user') {
    // ✅ Set req.user để controllers có thể truy cập
    req.user = req.session.user;
    return next();
  }

  // Nếu là AJAX request hoặc yêu cầu nhận JSON
  if (req.xhr || req.headers.accept.includes('json')) {
    return res.status(401).json({ message: 'Chưa đăng nhập với quyền người dùng' });
  }

  // Mặc định chuyển hướng đến trang login-user
  return res.redirect('/login-user');
}

module.exports = { isUser };