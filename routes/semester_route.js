const express = require('express')
const router = express.Router()
const semesterController = require('../controllers/SemesterController')
const scoreController = require('../controllers/ScoreController')

// router.get('/semester', semesterController.getSemester);
router.post('/:semesterId/add-score', semesterController.addScoreToSemester);

module.exports = router