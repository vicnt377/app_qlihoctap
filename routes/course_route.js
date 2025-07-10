const express = require('express')
const router = express.Router()
const courseController = require('../controllers/CourseController')
const { isUser } = require('../middlewares/authMiddleware')

router.get('/', isUser, courseController.getCourses)
router.post('/add-course', isUser, courseController.addCourseToScore);
router.post('/add-multiple', isUser, courseController.addMultipleCourses);




module.exports = router