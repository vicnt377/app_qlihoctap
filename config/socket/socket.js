const Message = require('../../models/Message');
const User = require('../../models/User');

module.exports = function (io) {

  const userSockets = new Map();

  const autoReplies = [
    {
      keywords: ['cách sử dụng hệ thống', 'hướng dẫn', 'help'],
      reply: `Xin chào \n
        Bạn có thể sử dụng các chức năng sau:
        - **Thêm học phần**: Tạo mới một học phần cho học kỳ.
        - **Import học phần**: Tải danh sách học phần từ file Excel.
        - **Tải tài liệu**: Upload tài liệu riêng hoặc công khai.
        - **Cập nhật học kỳ**: Chỉnh sửa thông tin học kỳ, học phần trong học kỳ.
        - **Thêm học kỳ mới**: Tạo học kỳ và gắn các học phần đã chọn.\n
        Gõ tên chức năng để xem hướng dẫn chi tiết!`
    },
    {
      keywords: ['thêm học phần', 'createcourse', 'addcourse'],
      reply: `Hướng dẫn Thêm Học Phần:
        1. Nhập mã học phần, tên học phần, số tín chỉ.
        2. Nếu mã học phần chưa tồn tại hệ thống sẽ lưu mới.
        3. Sau khi thêm, bạn nhận được thông báo xác nhận thành công.`
    },
    {
      keywords: ['import học phần', 'importcourses', 'nhập học phần'],
      reply: `Hướng dẫn Import Học Phần từ Excel:
        1. Chuẩn bị file Excel với các cột: maHocPhan, tenHocPhan, soTinChi.
        2. Vào trang Import, chọn file để tải lên.
        3. Hệ thống sẽ bỏ qua học phần trùng, báo lỗi nếu thiếu dữ liệu hoặc tín chỉ không hợp lệ.
        4. Sau khi import, bạn được chuyển về trang học kỳ.`
    },
    {
      keywords: ['upload tài liệu', 'uploaddocument', 'tải tài liệu'],
      reply: `Hướng dẫn upload tài liệu:
        1. Vào mục Tài liệu → Chọn file muốn tải.
        2. Nhập tiêu đề, chọn chế độ hiển thị.
        3. Sau khi tải lên thành công, bạn sẽ nhận thông báo kèm tên tài liệu.`
    },
    {   
      keywords: ['thêm học kỳ', 'addsemester', 'createsemester','tạo học kỳ'],
      reply: `Hướng dẫn Thêm Học Kỳ Mới:
        1. Nhập tên học kỳ và chọn các học phần đã có để gán vào học kỳ.
        2. Hệ thống sẽ tạo học kỳ mới với các học phần đã chọn.
        3. Sau khi thêm, bạn nhận được thông báo xác nhận thành công.`
    },
    {   
      keywords: ['cập nhật học kỳ', 'updatesemester', 'edithocky','sửa học kỳ'],
      reply: `Hướng dẫn Cập Nhật Học Kỳ:
        1. Vào trang chi tiết học kỳ cần cập nhật.
        2. Chỉnh sửa tên học kỳ (tenHocKy) và thay đổi các học phần được gán.
        3. Lưu thay đổi, hệ thống sẽ cập nhật thông tin học kỳ.
        4. Sau khi cập nhật, bạn nhận được thông báo xác nhận thành công.`
    },
  ];

  io.on('connection', (socket) => {

    socket.on('register', ({ userId }) => {
      userSockets.set(userId, socket.id);
    });

    socket.on('chatMessage', async ({ senderId, receiverId, message }) => {
      if (!message?.trim()) return;

      // Lưu tin nhắn user
      await Message.create({
        sender: senderId,
        receiver: receiverId,
        content: message
      });

      // Gửi cho người nhận
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('newMessage', {
          senderId,
          message
        });
      }

      //  AUTO-REPLY 
      const rule = autoReplies.find(r =>
        r.keywords.some(k => message.toLowerCase().includes(k))
      );

      if (rule) {
        // Lưu auto-reply
        await Message.create({
          sender: receiverId,
          receiver: senderId,
          content: rule.reply
        });

        const senderSocket = userSockets.get(senderId);
        if (senderSocket) {
          io.to(senderSocket).emit('newMessage', {
            senderId: receiverId,
            message: rule.reply
          });
        }
      }
    });

    socket.on('disconnect', () => {
      for (const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) {
          userSockets.delete(uid);
          break;
        }
      }
    });
  });
  return io;
  window.socket = window.socket || io();
};
