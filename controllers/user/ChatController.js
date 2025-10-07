const Message = require('../../models/Message');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const mongoose = require('mongoose')

class ChatController {
  // Hiển thị trang chat với tin nhắn đã gửi
  async index(req, res) {
    try {
      const userId = req.session.user?._id;
      if (!userId) {
        return res.redirect('/login-user');
      }

      const user = await User.findById(userId).lean();

      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(404).send('Admin not found');
      }

      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: admin._id },
          { sender: admin._id, receiver: userId },
        ]
      }).populate('sender', 'username').lean();

      messages.forEach(m => {
        m.sender._id = m.sender._id.toString(); 
      });
      
      // Danh sách gợi ý câu hỏi
      const suggestions = [
        { text: "Thêm học phần", keyword: "thêm học phần" },
        { text: "Import học phần", keyword: "import học phần" },
        { text: "Upload tài liệu", keyword: "upload tài liệu" },
        { text: "Cập nhật học kỳ", keyword: "cập nhật học kỳ" },
        { text: "Thêm học kỳ mới", keyword: "thêm học kỳ mới" },
        // { text: "❓ Hướng dẫn sử dụng hệ thống", keyword: "cách sử dụng hệ thống" }
      ];

      res.render('user/chat', {
        messages,
        suggestions,
        user,
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
    const content = req.body.message?.trim().toLowerCase();

    if (!content) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống' });
    }

    try {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(500).json({ error: 'Không tìm thấy admin' });
      }

      // ✅ Auto-reply cho các chức năng
      const autoReplies = [
        {
          keywords: ['cách sử dụng hệ thống', 'hướng dẫn', 'help'],
          reply: `Xin chào 👋\n
Bạn có thể sử dụng các chức năng sau:
- **Thêm học phần**: Tạo mới một học phần cho học kỳ.
- **Import học phần**: Tải danh sách học phần từ file Excel.
- **Tải tài liệu**: Upload tài liệu riêng hoặc công khai.
- **Cập nhật học kỳ**: Chỉnh sửa thông tin học kỳ, thời gian, lịch học.
- **Thêm học kỳ mới**: Tạo học kỳ và gắn các học phần đã chọn.\n
👉 Gõ tên chức năng để xem hướng dẫn chi tiết!`
        },
        {
          keywords: ['thêm học phần', 'createcourse'],
          reply: `📘 **Hướng dẫn Thêm Học Phần**:
1. Nhập mã học phần (maHocPhan), tên học phần (tenHocPhan), số tín chỉ (soTinChi).
2. Nếu mã học phần chưa tồn tại → hệ thống sẽ lưu mới.
3. Sau khi thêm, bạn nhận được thông báo xác nhận thành công.`
        },
        {
          keywords: ['import học phần', 'importcourses', 'nhập học phần'],
          reply: `📂 **Hướng dẫn Import Học Phần từ Excel**:
1. Chuẩn bị file Excel với các cột: maHocPhan, tenHocPhan, soTinChi.
2. Vào trang Import, chọn file để tải lên.
3. Hệ thống sẽ bỏ qua học phần trùng, báo lỗi nếu thiếu dữ liệu hoặc tín chỉ không hợp lệ.
4. Sau khi import, bạn được chuyển về trang học kỳ.`
        },
        {
          keywords: ['upload tài liệu', 'uploaddocument', 'tải tài liệu'],
          reply: `📑 **Hướng dẫn Upload Tài Liệu**:
1. Vào mục Tài liệu → Chọn file muốn tải.
2. Nhập tiêu đề (title), chọn chế độ hiển thị: Public hoặc Private.
3. Sau khi tải lên thành công, bạn sẽ nhận thông báo kèm tên tài liệu.`
        },
        {
          keywords: ['cập nhật học kỳ', 'updatesemester'],
          reply: `📅 **Hướng dẫn Cập Nhật Học Kỳ**:
1. Chọn học kỳ cần chỉnh sửa.
2. Cập nhật tên học kỳ, ngày bắt đầu, số tuần.
3. Chọn học phần và chỉnh sửa lịch học (thứ, giờ bắt đầu, giờ kết thúc).
4. Hệ thống sẽ lưu và gửi thông báo sau khi cập nhật.`
        },
        {
          keywords: ['thêm học kỳ mới', 'addnewsemester'],
          reply: `🆕 **Hướng dẫn Thêm Học Kỳ Mới**:
1. Nhập tên học kỳ, ngày bắt đầu và số tuần.
2. Chọn danh sách học phần muốn thêm (kèm lịch học).
3. Hệ thống tạo học kỳ mới, gắn các học phần vào bảng điểm.
4. Bạn nhận được thông báo xác nhận học kỳ đã thêm.`
        }
      ];

      const io = req.app.get("io"); // lấy socket.io đã gắn trong app.js
      io.to(admin._id.toString()).emit("newMessage", {
        senderId: user._id.toString(),
        senderName: user.username,
        message: content,
      });

      const matchedRule = autoReplies.find(rule =>
        rule.keywords.some(k => content.includes(k))
      );

      if (matchedRule) {
        // Lưu tin nhắn user
        await Message.create({
          sender: user._id,
          receiver: admin._id,
          content
        });

        // Trả lời tự động
        return res.json({ success: true, autoReply: matchedRule.reply });
      }

      // ❌ Không có auto-reply → gửi cho admin
      await Message.create({
        sender: user._id,
        receiver: admin._id,
        content
      });

      return res.json({
        success: true,
        reply: 'Tin nhắn của bạn đã được gửi đến Người Quản Trị. Vui lòng chờ phản hồi!'
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Lỗi máy chủ khi gửi tin nhắn' });
    }
  }

}

module.exports = new ChatController();
