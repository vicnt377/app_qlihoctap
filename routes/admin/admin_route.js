const express = require('express')
const router = express.Router()
const Video = require('../../models/Video');
const courseController = require('../../controllers/admin/CourseController')
const dashboardController = require('../../controllers/admin/DashboardController')
const loginController = require('../../controllers/admin/LoginController')
const userController = require('../../controllers/admin/UserController')
const videoController = require('../../controllers/admin/VideoController')
const statisticController = require('../../controllers/admin/StatisticController')
const chatController = require('../../controllers/admin/ChatController');
const {isAdmin} = require('../../middlewares/adminCheck');

//Login
router.get('/login-admin', loginController.login_admin)
router.post('/login-admin', loginController.login)

//Dashboard
router.get("/dashboard",isAdmin, dashboardController.dashboard)

//User
router.get("/users",isAdmin, userController.getUsers)
router.patch("/users/:id/clock", isAdmin, userController.clockUser)
router.post("/users/add", isAdmin, userController.addUser)
router.delete("/users/:id/delete", isAdmin, userController.deleteUser)

//Course
router.get("/courses", isAdmin, courseController.getCourses)
router.post('/courses/create', isAdmin, courseController.createCourse)
router.post('/courses/edit/:id', isAdmin, courseController.editCourse)
router.post('/courses/delete/:id', isAdmin, courseController.deleteCourse)
router.post('/courses/restore/:id', isAdmin, courseController.restoreCourse)


//Video
router.get("/videos", isAdmin, videoController.getVideos)
router.get('/videos/search', isAdmin, videoController.searchAndPreview);
router.get("/videos/youtube-search", isAdmin, videoController.searchAndPreview);
router.post('/videos/create', isAdmin, videoController.createVideo)
router.patch('/videos/:id/edit', isAdmin, videoController.editVideo);
router.delete('/videos/:id/delete', isAdmin, videoController.deleteVideo);
router.patch('/videos/:id/restore', isAdmin, videoController.restoreVideo);
router.get('/videos/:id', isAdmin, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video không tồn tại' });
    res.json(video);
  } catch (error) {
    console.error('Lỗi khi lấy video:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy video' });
  }
});

//Chat
router.get('/chat', isAdmin, chatController.inbox);
// Trang cuộc trò chuyện với 1 user
router.get('/chat/:userId', isAdmin, chatController.conversation);
// Gửi tin nhắn trả lời
router.post('/chat/:userId',isAdmin, chatController.reply);



//Statistic
router.get("/statistic", isAdmin, statisticController.statistic)

module.exports = router