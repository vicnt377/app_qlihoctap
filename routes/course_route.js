const express = require('express')
const router = express.Router()
const courseController = require('../controllers/CourseController')

router.get('/', courseController.getCourses)
router.post('/add-course', courseController.addCourseToScore);




module.exports = router