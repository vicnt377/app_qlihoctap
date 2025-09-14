const express = require('express')
const router = express.Router()
const semesterController = require('../../controllers/user/SemesterController')
const courseController = require('../../controllers/user/CourseController')
const { isUser } = require('../../middlewares/userCheck')

router.get('/', isUser, semesterController.getSemester)
router.post('/add',isUser,  semesterController.addNewSemester);

router.post('/delete/:id',isUser, semesterController.deleteSemester);

router.get('/edit/:id',isUser, semesterController.editSemesterForm);

router.post('/update/:id',isUser, semesterController.updateSemester);

router.post('/add-course', isUser, courseController.addCourseToScore);

module.exports = router