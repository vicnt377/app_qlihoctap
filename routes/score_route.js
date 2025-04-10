const express = require('express')
const router = express.Router()
const scoreController = require('../controllers/ScoreController')

router.get('/score', scoreController.index)
// router.post('/score/add-course', scoreController.addCourseToSemester);

module.exports = router