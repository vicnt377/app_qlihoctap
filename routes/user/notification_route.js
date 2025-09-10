const express = require('express')
const router = express.Router()
const notificationController = require('../../controllers/user/notificationController')
const { isUser } = require('../../middlewares/authMiddleware')


router.get("/page", isUser, notificationController.renderNotificationsPage)
// ✅ Route chính để lấy thông báo của user (khớp với frontend)
router.get("/user", isUser, notificationController.getUserNotifications)

// ✅ Route để lấy thống kê thông báo
router.get("/stats", isUser, notificationController.getNotificationStats)

// ✅ Route để đánh dấu thông báo đã đọc
router.patch("/:notificationId/read", isUser, notificationController.markAsRead)

// ✅ Route để đánh dấu tất cả thông báo đã đọc
router.patch("/mark-all-read", isUser, notificationController.markAllAsRead)

// ✅ Route để xóa thông báo
router.delete("/:notificationId", isUser, notificationController.deleteNotification)

// ✅ Route để tạo thông báo mới (admin only)
router.post("/", isUser, notificationController.createNotification)

// ✅ Route để tạo thông báo cho nhiều người (admin only)
router.post("/multiple", isUser, notificationController.createMultipleNotifications)

// ✅ Route cũ để tương thích ngược
router.get("/", isUser, notificationController.getUserNotifications)
router.post("/mark-as-read/:id", isUser, notificationController.markAsRead)      
router.post("/mark-all-as-read", isUser, notificationController.markAllAsRead)
router.get("/load-more", isUser, notificationController.loadMoreNotifications)

module.exports = router