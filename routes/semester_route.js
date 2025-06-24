const express = require('express')
const router = express.Router()
const semesterController = require('../controllers/SemesterController')
const scoreController = require('../controllers/ScoreController')
const { isUser } = require('../middlewares/authMiddleware')

router.get('/', isUser, semesterController.getClass)
router.post('/add',isUser,  semesterController.addNewSemester);

module.exports = router