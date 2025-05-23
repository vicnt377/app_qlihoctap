const User = require('../models/User');

class HomeController {
  async index(req, res, next) {
    try {
      // Giả sử bạn lưu ID người dùng trong session
      const userId = req.session.userId;

      if (!userId) {
        return res.redirect('/login');
      }

      const user = await User.findById(userId).lean(); // dùng .lean() để dễ render vào Handlebars

      if (!user) {
        return res.redirect('/login');
      }

      res.render('home', { user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HomeController();
