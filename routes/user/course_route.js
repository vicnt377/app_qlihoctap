const express = require('express')
const router = express.Router()
const courseController = require('../../controllers/user/CourseController')
const { isUser } = require('../../middlewares/authMiddleware')

router.get('/', isUser, courseController.getCourses)
router.post('/add-course', isUser, courseController.addCourseToScore);




module.exports = router