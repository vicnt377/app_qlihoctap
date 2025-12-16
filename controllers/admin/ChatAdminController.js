const Message = require('../../models/Message');
const User = require('../../models/User');
const mongoose = require('mongoose');

class ChatController {

  // 📥 Inbox admin
  async inbox(req, res) {
    try {
      const adminId = new mongoose.Types.ObjectId(req.session.user._id);

      const partners = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: adminId }, { receiver: adminId }]
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', adminId] },
                '$receiver',
                '$sender'
              ]
            },
            lastMessage: { $first: '$content' },
            lastTime: { $first: '$createdAt' }
          }
        }
      ]);

      const userIds = partners.map(p => p._id);

      const users = await User.find({ _id: { $in: userIds } })
        .select('username')
        .lean();

      const unreadCounts = await Message.aggregate([
        { $match: { receiver: adminId, isRead: false } },
        { $group: { _id: '$sender', count: { $sum: 1 } } }
      ]);

      const unreadMap = {};
      unreadCounts.forEach(u => {
        unreadMap[u._id.toString()] = u.count;
      });

      const chats = partners
        .map(p => {
          const user = users.find(u => u._id.toString() === p._id.toString());
          if (!user) return null;

          return {
            user,
            lastMessage: p.lastMessage,
            timestamp: p.lastTime,
            unreadCount: unreadMap[p._id.toString()] || 0
          };
        })
        .filter(Boolean);

      res.render('admin/chatInbox', {
        layout: 'admin',
        chats,
        adminId: req.session.user._id
      });

    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi lấy danh sách chat');
    }
  }

  // 💬 Lấy tin nhắn
  async getMessages(req, res) {
    try {
      const adminId = req.session.user._id;
      const userId = req.params.userId;

      const messages = await Message.find({
        $or: [
          { sender: adminId, receiver: userId },
          { sender: userId, receiver: adminId }
        ]
      })
        .populate('sender', 'username')
        .sort({ createdAt: 1 })
        .lean();

      res.json({ messages });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi lấy tin nhắn' });
    }
  }

  // ✅ Đánh dấu đã đọc
  async markRead(req, res) {
    try {
      const adminId = req.session.user._id;
      const userId = req.params.userId;

      await Message.updateMany(
        { sender: userId, receiver: adminId, isRead: false },
        { $set: { isRead: true } }
      );

      res.json({ success: true });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi đánh dấu đã đọc' });
    }
  }
}

module.exports = new ChatController();
