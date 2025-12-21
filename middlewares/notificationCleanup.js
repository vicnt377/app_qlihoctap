// const cron = require("node-cron");
// const Notification = require("../models/Notification");

// cron.schedule("* * * * *", async () => {   // chạy mỗi phút
//   try {
//     const cutoff = new Date(Date.now() - 10 * 60 * 1000); 
//     const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });

//     console.log(` Đã xóa ${result.deletedCount} thông báo cũ hơn 60 phút`);
//   } catch (err) {
//     console.error(" Lỗi khi xóa thông báo cũ:", err);
//   }

// });


// module.exports = cron;