const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/UserAdminController');
const { isAdmin } = require('../../middlewares/adminCheck');

// USER management
router.get('/users', isAdmin, userController.getUsers);
router.patch('/users/:id/clock', isAdmin, userController.clockUser);
router.post('/users/add', isAdmin, userController.addUser);
router.delete('/users/:id/delete', isAdmin, userController.deleteUser);

router.get("/send-test-email",  userController.testSendMail);


module.exports = router;
