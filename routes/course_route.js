const express = require('express')
const router = express.Router()
const courseController = require('../controllers/CourseController')

router.get('/course', courseController.getCourses)
router.post('/course/add', courseController.addCourse);
router.post('/course/update/:id', courseController.updateCourse);
router.post('/course/delete/:id', courseController.deleteCourse);

module.exports = router