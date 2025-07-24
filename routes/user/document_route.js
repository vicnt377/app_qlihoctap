const express = require('express');
const router = express.Router();
const documentController = require('../../controllers/user/DocumentController')
const { isUser } = require('../../middlewares/authMiddleware')

router.get('/', isUser, documentController.getDocument);



// Gọi handleUpload thay vì trực tiếp dùng middleware trong route
router.post('/upload', isUser, documentController.handleUpload, documentController.uploadDocument)

router.post('/delete/:id',isUser, documentController.deleteDocument)

module.exports = router;
