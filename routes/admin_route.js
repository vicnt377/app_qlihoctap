const express = require('express')
const router = express.Router()
const adminController = require('../controllers/AdminController')
const {isAdmin} = require('../middlewares/adminMiddleware');


router.get('/login-admin', adminController.login_admin)
router.post('/login-admin', adminController.login)

//Dashboard
router.get("/dashboard",isAdmin, adminController.dashboard)

//User
router.get("/users",isAdmin, adminController.getUsers)


//Course
router.get("/courses", isAdmin, adminController.getCourses)
router.post('/courses/create', isAdmin, adminController.createCourse)
router.post('/courses/edit/:id', isAdmin, adminController.editCourse)
router.post('/courses/delete/:id', isAdmin, adminController.deleteCourse)
router.post('/courses/restore/:id', isAdmin, adminController.restoreCourse)


//Video
router.get("/videos", isAdmin, adminController.getVideos)
router.post('/videos/create', isAdmin, adminController.createVideo)
router.post('/videos/edit/:id', isAdmin, adminController.editVideo)
router.post('/videos/delete/:id', isAdmin, adminController.deleteVideo)

//Statistic
router.get("/statistic", isAdmin, adminController.statistic)

module.exports = router