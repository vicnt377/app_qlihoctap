const express = require('express')
const router = express.Router()
const courseController = require('../controllers/CourseController')

router.get('/course', courseController.index)

module.exports = router