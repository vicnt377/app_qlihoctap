const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = require('../middlewares/uploadMiddlewares'); // import upload

class DocumentController {
  async getDocument(req, res, next) {
    try {
      const userId = req.session?.user?._id;
      if (!userId) return res.redirect('/login');

      const documents = await Document.find({ username: userId });
      res.render('user/document', { user: req.session.user, documents });
    } catch (err) {
      next(err);
    }
  }

  // 👉 Wrapper xử lý multer + lỗi
  handleUpload(req, res, next) {
    upload.single('file')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        req.session.errorMessage = 'Lỗi khi upload file.';
        return res.redirect('/document/upload');
      } else if (err) {
        req.session.errorMessage = err.message;
        return res.redirect('/document/upload');
      }

      // Gọi tiếp đến upload logic
      await this.uploadDocument(req, res, next);
    });
  }

  // 👉 Logic lưu thông tin file
  async uploadDocument(req, res, next) {
    try {
      const userId = req.session?.user?._id;
      if (!userId || !req.file || !req.body.title) {
        req.session.errorMessage = "Thiếu thông tin khi upload tài liệu.";
        return res.redirect('/document/upload');
      }

      const newDoc = new Document({
        username: userId,
        title: req.body.title,
        file: `${userId}/${req.file.filename}` // Lưu đường dẫn tương đối
      });

      await newDoc.save();
      res.redirect('/document');
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const docId = req.params.id;
      const userId = req.session?.user?._id;

      if (!docId || !userId) {
        req.session.errorMessage = 'Thiếu thông tin khi xóa.';
        return res.redirect('/document');
      }

      const doc = await Document.findOne({ _id: docId, username: userId });
      if (!doc) {
        req.session.errorMessage = 'Không tìm thấy tài liệu hoặc không có quyền xóa.';
        return res.redirect('/document');
      }

      // file: 680ff5807e01374e584024c4/tên-file.docx
      const relativePath = doc.file;
      const absolutePath = path.resolve(__dirname, '../src/public/file', relativePath);

      // Kiểm tra và xóa file nếu tồn tại
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      } else {
        console.warn('Không tìm thấy file trên ổ đĩa:', absolutePath);
      }

      // Xóa tài liệu trong DB
      await Document.deleteOne({ _id: docId });
      console.log('Đường dẫn file cần xóa:', absolutePath);

      req.session.successMessage = 'Đã xóa tài liệu thành công.';
      res.redirect('/document');
    } catch (err) {
      console.error('Lỗi khi xóa tài liệu:', err);
      req.session.errorMessage = 'Đã xảy ra lỗi khi xóa tài liệu.';
      res.redirect('/document');
    }
  }
}

module.exports = new DocumentController();
