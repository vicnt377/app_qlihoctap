const Message = require('../../models/Message');
const User = require('../../models/User');

class ChatController {

  // Hiển thị trang chat user
  async index(req, res) {
    try {
      const userId = req.session.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      const admin = await User.findOne({ role: 'admin' }).lean();

      if (!admin) {
        return res.status(404).send('Admin not found');
      }

      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: admin._id },
          { sender: admin._id, receiver: userId }
        ]
      })
        .populate('sender', 'username')
        .sort({ createdAt: 1 })
        .lean();

      messages.forEach(m => {
        m.sender._id = m.sender._id.toString();
      });

      const suggestions = [
        { text: "Thêm học phần", keyword: "thêm học phần" },
        { text: "Import học phần", keyword: "import học phần" },
        { text: "Upload tài liệu", keyword: "upload tài liệu" },
        { text: "Cập nhật học kỳ", keyword: "cập nhật học kỳ" },
        { text: "Thêm học kỳ mới", keyword: "thêm học kỳ mới" }
      ];

      res.render('user/chat', {
        user,
        adminId: admin._id.toString(),
        messages,
        suggestions
      });

    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi máy chủ');
    }
  }

}

module.exports = new ChatController();
