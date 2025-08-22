// function isUser(req, res, next) {
//   // Nếu đã đăng nhập và có user trong session
//   if (req.session && req.session.user && req.session.user.role === 'user') {
//     // ✅ Set req.user để controllers có thể truy cập
//     req.user = req.session.user;
//     return next();
//   }

//   // Nếu là AJAX request hoặc yêu cầu nhận JSON
//   if (req.xhr || req.headers.accept.includes('json')) {
//     return res.status(401).json({ message: 'Chưa đăng nhập với quyền người dùng' });
//   }

//   // Mặc định chuyển hướng đến trang login-user
//   return res.redirect('/login-user');
// }

// module.exports = { isUser };

const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");

function isUser(req, res, next) {
  const { userId, sessionClaims } = req.auth;

  // ❌ Nếu chưa đăng nhập
  if (!userId) {
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }
    return res.redirect("/login");
  }

  // ✅ Check role từ Clerk custom claims
  if (sessionClaims?.role === "user") {
    req.user = { id: userId, role: sessionClaims.role };
    return next();
  }

  // ❌ Nếu không phải user
  return res.status(403).json({ message: "Không có quyền truy cập" });
}

function isAdmin(req, res, next) {
  const { userId, sessionClaims } = req.auth;
  if (!userId) return res.redirect("/login");

  if (sessionClaims?.role === "admin") {
    req.user = { id: userId, role: sessionClaims.role };
    return next();
  }

  return res.status(403).json({ message: "Chỉ admin mới được phép truy cập" });
}

module.exports = { isUser, isAdmin };

