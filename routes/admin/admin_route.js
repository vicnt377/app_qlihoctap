const express = require('express')
const router = express.Router()
const courseController = require('../../controllers/admin/CourseController')
const dashboardController = require('../../controllers/admin/DashboardController')
const loginController = require('../../controllers/admin/LoginController')
const userController = require('../../controllers/admin/UserController')
const videoController = require('../../controllers/admin/VideoController')
const statisticController = require('../../controllers/admin/StatisticController')
const chatController = require('../../controllers/admin/ChatController');
const {isAdmin} = require('../../middlewares/adminMiddleware');

//Login
router.get('/login-admin', loginController.login_admin)
router.post('/login-admin', loginController.login)

//Dashboard
router.get("/dashboard",isAdmin, dashboardController.dashboard)

//User
router.get("/users",isAdmin, userController.getUsers)
router.patch("/users/:id/clock", isAdmin, userController.clockUser)

//Course
router.get("/courses", isAdmin, courseController.getCourses)
router.post('/courses/create', isAdmin, courseController.createCourse)
router.post('/courses/edit/:id', isAdmin, courseController.editCourse)
router.post('/courses/delete/:id', isAdmin, courseController.deleteCourse)
router.post('/courses/restore/:id', isAdmin, courseController.restoreCourse)


//Video
router.get("/videos", isAdmin, videoController.getVideos)
router.post('/videos/create', isAdmin, videoController.createVideo)
router.post('/videos/edit/:id', isAdmin, videoController.editVideo)
router.post('/videos/delete/:id', isAdmin, videoController.deleteVideo)
router.get('/videos/search', isAdmin, videoController.fetchVideosBySearch);

router.get("/videos/youtube-search", isAdmin, videoController.searchAndPreview);

//Chat
router.get('/chat', isAdmin, chatController.inbox);
// Trang cuộc trò chuyện với 1 user
router.get('/chat/:userId', isAdmin, chatController.conversation);
// Gửi tin nhắn trả lời
router.post('/chat/:userId',isAdmin, chatController.reply);



//Statistic
router.get("/statistic", isAdmin, statisticController.statistic)

module.exports = router