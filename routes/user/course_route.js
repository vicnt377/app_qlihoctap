const express = require('express')
const router = express.Router()
const courseController = require('../../controllers/user/CourseController')
const { isUser } = require('../../middlewares/authMiddleware')
const multer = require('multer')
const path = require('path')

// Cấu hình multer để upload file Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'course-import-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép file Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true)
    } else {
      cb(new Error('Chỉ cho phép file Excel (.xlsx, .xls)'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
})

// Routes hiện tại
router.get('/', isUser, courseController.getCourses)
router.post('/add-course', isUser, courseController.addCourseToScore)

// Routes mới cho import
router.post('/import', isUser, upload.single('excelFile'), courseController.importCourses)
router.get('/template', isUser, courseController.getExcelTemplate)
router.delete('/:courseId', isUser, courseController.deleteCourse)

module.exports = router