const express = require('express');
const router = express.Router();
const documentController = require('../controllers/DocumentController')
const { isUser } = require('../middlewares/authMiddleware')

router.get('/', isUser, documentController.getDocument);

// Giao diện upload
router.get('/upload', (req, res) => {
  res.render('user/upload', { user: req.session.user })
})

// Gọi handleUpload thay vì trực tiếp dùng middleware trong route
router.post('/upload', isUser, documentController.handleUpload)

router.post('/delete/:id',isUser, documentController.deleteDocument)

module.exports = router;
