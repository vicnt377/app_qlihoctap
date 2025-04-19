const express = require('express')
const router = express.Router()
const courseController = require('../controllers/CourseController')

router.get('/course', courseController.getCourses)
router.post('/course/add-course', courseController.addCourseToScore);


module.exports = router