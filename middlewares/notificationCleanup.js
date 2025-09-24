const cron = require("node-cron");
const Notification = require("../models/Notification");

cron.schedule("* * * * *", async () => {   // chạy mỗi phút
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); 
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });

    console.log(`🗑️ Đã xóa ${result.deletedCount} thông báo cũ hơn 10 phút`);
  } catch (err) {
    console.error("❌ Lỗi khi xóa thông báo cũ:", err);
  }

});


