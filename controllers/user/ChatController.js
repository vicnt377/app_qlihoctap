class ChatController {
  // Hiển thị trang chat
  index(req, res) {
    res.render('user/chat', { user: req.session.user, messages: [] });
  }

  // Gửi tin nhắn và trả lời hệ thống
  sendMessage(req, res) {
    const userMessage = req.body.message?.trim();

    if (!userMessage) {
      return res.redirect('/chat');
    }

    const systemReply = `Hệ thống: Bạn vừa nói "${userMessage}"`;

    const messages = [
      { sender: 'user', text: userMessage },
      { sender: 'system', text: systemReply },
    ];

    res.render('user/chat', { user: req.session.user, messages });
  }
}

module.exports = new ChatController();
