const express = require('express')
const router = express.Router()
const adminController = require('../controllers/AdminController')
const {isAdmin} = require('../middlewares/adminMiddleware');


router.get("/dashboard",isAdmin, adminController.dashboard)
router.get("/users",isAdmin, adminController.users)
router.get("/courses",isAdmin, adminController.courses)
router.get("/promote/:id", isAdmin, adminController.promoteUser);

module.exports = router