// deleteOldMessages.js
const mongoose = require('mongoose');
const Message = require('../models/Message');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/quanlitiendo');

    const days = 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Message.deleteMany({ timestamp: { $lt: cutoff } });

    console.log(`Đã xóa ${result.deletedCount} tin nhắn cũ hơn ${days} ngày`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
