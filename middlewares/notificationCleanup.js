const cron = require("node-cron");
const Notification = require("../models/Notification");

cron.schedule("0 0 * * *", async () => {   // chạy mỗi phút
  try {
    const cutoff = new Date(Date.now() - 1 * 60 * 1000); // cũ hơn 1 phút
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });

    console.log(`🗑️ Đã xóa ${result.deletedCount} thông báo cũ hơn 1 phút`);
  } catch (err) {
    console.error("❌ Lỗi khi xóa thông báo cũ:", err);
  }

});


