const Message = require('../../models/Message');
const User = require('../../models/User');   // user thường
const Admin = require('../../models/Admin'); // admin riêng
const mongoose = require('mongoose');

class ChatController{

  async inbox(req, res) {
    try {
      const adminId = new mongoose.Types.ObjectId(req.session.user._id);

      // Tìm tất cả user từng nhắn với admin
      const partners = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: adminId },
              { receiver: adminId }
            ]
          }
        },
        { $sort: { timestamp: -1 } },

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
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);

      // Danh sách userId
      const userIds = partners.map(p => p._id);

      // 🔥 Lấy thông tin user tương ứng
      const users = await User.find({ _id: { $in: userIds } });

      // 🔥 Đếm tin nhắn chưa đọc từ mỗi user
      const unreadCounts = await Message.aggregate([
        { $match: { receiver: adminId, isRead: false } },
        { $group: { _id: '$sender', count: { $sum: 1 } } }
      ]);

      // Chuyển thành map
      const unreadMap = {};
      unreadCounts.forEach(u => {
        unreadMap[u._id.toString()] = u.count;
      });

      // 🔥 Ghép dữ liệu cuối cùng
      const result = partners.map(p => ({
        user: users.find(u => u._id.toString() === p._id.toString()),
        lastMessage: p.lastMessage,
        timestamp: p.timestamp,
        unreadCount: unreadMap[p._id.toString()] || 0
      }));

      res.render("admin/chatInbox", {
        layout: 'admin',
        chats: result,
        adminId: req.session.user._id
      });

    } catch (err) {
      console.error(err);
      res.status(500).send("Lỗi lấy danh sách chat");
    }
  }

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
        .populate("sender", "username")
        .sort({ timestamp: 1 });

      res.json({ messages });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi lấy tin nhắn" });
    }
  }

  //  ĐÁNH DẤU ĐÃ ĐỌC TIN NHẮN
  async markRead(req, res) {
    try {
      const adminId = req.session.user._id;
      const userId = req.params.userId;

      await Message.updateMany(
        { sender: userId, receiver: adminId, isRead: false },
        { $set: { isRead: true } }
      );

      res.json({ ok: true });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi đánh dấu đã đọc" });
    }
  }
}

module.exports = new ChatController();
