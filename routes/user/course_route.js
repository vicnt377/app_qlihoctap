const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/user/CourseController');
const { isUser } = require('../../middlewares/userCheck');
const uploadExcel = require('../../middlewares/uploadExcel');

// Routes hiện tại
router.get('/', isUser, courseController.getCourses);
router.post('/add-course', isUser, courseController.createCourse);

// router.post('/add-course', isUser, courseController.addCourseToScore);

// Routes mới cho import
router.post('/import', isUser, uploadExcel.single('excelFile'), courseController.importCourses);
router.get('/template', isUser, courseController.getExcelTemplate);
router.delete('/:courseId', isUser, courseController.deleteCourse);

module.exports = router;
