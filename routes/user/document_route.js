const express = require('express');
const router = express.Router();
const documentController = require('../../controllers/user/DocumentController')
const { isUser } = require('../../middlewares/userCheck')
const uploadAndConvert = require('../../middlewares/uploadFile');

router.get('/', isUser, documentController.getDocument);

router.post('/upload', isUser,
  documentController.handleUpload,
  documentController.uploadDocument
);

router.post('/delete/:id',isUser, documentController.deleteDocument)

// Xem trước file bằng id
router.get('/preview/:id', isUser ,documentController.previewFile);


// Route cho download document
router.get('/download/:id', isUser, documentController.downloadDocument)

module.exports = router;
