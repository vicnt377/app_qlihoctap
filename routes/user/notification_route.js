const express = require('express')
const router = express.Router()
const notificationController = require('../../controllers/user/notificationController')
const { isUser } = require('../../middlewares/userCheck')


router.get("/page", isUser, notificationController.renderNotificationsPage)
// ✅ Route chính để lấy thông báo của user (khớp với frontend)
router.get("/user", isUser, notificationController.getUserNotifications)

// ✅ Route để đánh dấu thông báo đã đọc
router.patch("/:notificationId/read", isUser, notificationController.markAsRead)

// ✅ Route để đánh dấu tất cả thông báo đã đọc
router.patch("/mark-all-read", isUser, notificationController.markAllAsRead)

// ✅ Route để tạo thông báo mới (admin only)
router.post("/", isUser, notificationController.createNotification)

// ✅ Route để tạo thông báo cho nhiều người (admin only)
router.post("/multiple", isUser, notificationController.createMultipleNotifications)

module.exports = router