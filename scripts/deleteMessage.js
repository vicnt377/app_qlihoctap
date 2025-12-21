// deleteAllMessages.js
const mongoose = require('mongoose');
const Message = require('../models/Notification');

(async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect('mongodb://localhost:27017/quanlitiendo');

    // Xóa tất cả thông báo
    const result = await Message.deleteMany({});

    console.log(`Đã xóa toàn bộ ${result.deletedCount} thông báo`);

    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi xóa thông báo:', err);
    process.exit(1);
  }
})();

