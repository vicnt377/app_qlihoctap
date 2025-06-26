const express = require('express')
const router = express.Router()
const adminController = require('../controllers/AdminController')
const {isAdmin} = require('../middlewares/adminMiddleware');


router.get("/dashboard",isAdmin, adminController.dashboard)
//User
router.get("/users",isAdmin, adminController.users)
router.get("/promote/:id", isAdmin, adminController.promoteUser)

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

module.exports = router