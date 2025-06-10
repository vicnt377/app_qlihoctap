const express = require('express');
const router = express.Router();
const documentController = require('../controllers/DocumentController');

router.get('/', documentController.getDocument);

// Giao diện upload
router.get('/upload', (req, res) => {
  res.render('user/upload', { user: req.session.user });
});

// Gọi handleUpload thay vì trực tiếp dùng middleware trong route
router.post('/upload', (req, res, next) => {
  documentController.handleUpload(req, res, next);
});

router.post('/delete/:id', documentController.deleteDocument)

module.exports = router;
