const express = require('express')
const router = express.Router()
const semesterController = require('../controllers/SemesterController')
const scoreController = require('../controllers/ScoreController')

router.get('/semester', semesterController.getSemester);

module.exports = router