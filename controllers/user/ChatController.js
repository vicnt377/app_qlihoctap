const Message = require('../../models/Message');
const User = require('../../models/User');
const mongoose = require('mongoose')

class ChatController {
  // Hiển thị trang chat với tin nhắn đã gửi (có thể thêm sau)
async index(req, res) {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/login-user');
    }

    const userId = user._id;
    console.log("SESSION HIỆN TẠI:", req.session);

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).send('Admin not found');
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: admin._id },
        { sender: admin._id, receiver: userId },
      ]
    }).populate('sender', 'name').lean();

    messages.forEach(m => {
      m.sender._id = m.sender._id.toString(); 
    });
    
    res.render('user/chat', {
      messages,
      user: {
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        role: user.role
      },
      adminId: admin._id.toString()
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi máy chủ');
  }
}

  // Gửi tin nhắn của user tới admin
  async sendMessage(req, res) {
    const user = req.session.user;
    const content = req.body.message?.trim();

    if (!content) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống' });
    }

    try {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(500).json({ error: 'Không tìm thấy admin' });
      }

      await Message.create({
        sender: user._id,
        receiver: admin._id,
        content
      });

      return res.json({ success: true, reply: 'Tin nhắn của bạn đã được gửi đến Người Quản Trị. Vui lòng chờ trong ít phút để nhận phản hồi!' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Lỗi máy chủ khi gửi tin nhắn' });
    }
  }

}

module.exports = new ChatController();
