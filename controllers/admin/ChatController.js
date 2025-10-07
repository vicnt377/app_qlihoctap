const Message = require('../../models/Message');
const User = require('../../models/User')
const mongoose = require('mongoose')


class ChatAdminController {
  // Hiển thị danh sách các user đã nhắn tin
    async inbox(req, res) {
    try {
        // Đảm bảo adminId là ObjectId
        const adminId = new mongoose.Types.ObjectId(req.session.user._id);

        // Lấy danh sách những user đã chat với admin
        const partners = await Message.aggregate([
        {
            $match: {
            $or: [
                { sender: adminId },
                { receiver: adminId }
            ]
            }
        },
        {
            $sort: { timestamp: -1 } // Sắp xếp trước để $group lấy tin nhắn mới nhất
        },
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
        },
        {
            $sort: { timestamp: -1 }
        }
        ]);

        const userIds = partners.map(p => p._id);
        const users = await User.find({ _id: { $in: userIds } });

        const result = partners.map(p => ({
        user: users.find(u => u._id.toString() === p._id.toString()),
        lastMessage: p.lastMessage,
        timestamp: p.timestamp
        }));

        res.render('admin/chatInbox', { 
            layout:'admin', 
            chats: result });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi lấy danh sách chat');
    }
    }


  // Hiển thị cuộc trò chuyện với 1 user cụ thể
    async conversation(req, res) {
        try {
        const adminId = req.session.user._id;
        const userId = req.params.userId;

        const messages = await Message.find({
            $or: [
            { sender: adminId, receiver: userId },
            { sender: userId, receiver: adminId }
            ]
        }).sort({ timestamp: 1 }).populate('sender');

        const user = await User.findById(userId);

        res.render('admin/chatConversation', { 
            layout:'admin' ,
            user,
            messages,
            adminId: adminId.toString(),
            userId: userId.toString() 
        });
        } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi xem cuộc trò chuyện');
        }
    }

  // Admin gửi trả lời user
    async reply(req, res) {
        try {
        const adminId = req.session.user._id;
        const userId = req.params.userId;
        const content = req.body.message?.trim();

        if (!content) return res.redirect(`/admin/chat/${userId}`);

        await Message.create({
            sender: adminId,
            receiver: userId,
            content
        });

        res.redirect(`/admin/chat/${userId}`);
        } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi gửi trả lời');
        }
    }
}

module.exports = new ChatAdminController();