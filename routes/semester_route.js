const express = require('express')
const router = express.Router()
const semesterController = require('../controllers/SemesterController')
const scoreController = require('../controllers/ScoreController')


router.get('/', semesterController.getClass)
router.post('/add', semesterController.addNewSemester);

module.exports = router