const Document = require('../../models/Document');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = require('../../middlewares/uploadMiddlewares'); // import upload

class DocumentController {
  async getDocument(req, res, next) {
    try {
      const userId = req.session?.user?._id;
      if (!userId) return res.redirect('/login');

      const q = req.query.q || '';
      const regex = new RegExp(q, 'i'); // tìm không phân biệt hoa thường

      const documents = await Document.find({
        username: userId,
        title: regex,
      }).sort({ createdAt: -1 });

      // Thêm thông tin file size và type cho mỗi document
      const documentsWithInfo = documents.map(doc => {
        const docObj = doc.toObject();
        const filePath = path.resolve(__dirname, '../src/public/file', doc.file);
        
        // Lấy thông tin file
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          docObj.fileSize = this.formatFileSize(stats.size);
          docObj.fileType = this.getFileType(doc.file);
          docObj.originalName = this.getOriginalFileName(doc.file);
        } else {
          docObj.fileSize = 'N/A';
          docObj.fileType = 'unknown';
          docObj.originalName = 'File không tồn tại';
        }
        
        return docObj;
      });

      res.render('user/document', {
        user: req.session.user,
        documents: documentsWithInfo,
        query: q,
      });
    } catch (err) {
      next(err);
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') return 'pdf';
    if (['.doc', '.docx'].includes(ext)) return 'doc';
    if (['.xls', '.xlsx'].includes(ext)) return 'xls';
    if (['.ppt', '.pptx'].includes(ext)) return 'ppt';
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    if (imageExts.includes(ext)) return 'image';
    const textExts = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js'];
    if (textExts.includes(ext)) return 'text';
    return 'other';
  }


  // Get original file name
  getOriginalFileName(filePath) {
    return path.basename(filePath);
  }

  // Download document
  async downloadDocument(req, res, next) {
    try {
      const docId = req.params.id;
      const userId = req.session?.user?._id;

      if (!docId || !userId) {
        req.session.errorMessage = 'Thiếu thông tin khi tải xuống.';
        return res.redirect('/document');
      }

      const doc = await Document.findOne({ _id: docId, username: userId });
      if (!doc) {
        req.session.errorMessage = 'Không tìm thấy tài liệu hoặc không có quyền tải xuống.';
        return res.redirect('/document');
      }

      const filePath = path.resolve(__dirname, '../src/public/file', doc.file);
      
      if (!fs.existsSync(filePath)) {
        req.session.errorMessage = 'File không tồn tại trên server.';
        return res.redirect('/document');
      }

      // Lấy tên file gốc
      const originalName = this.getOriginalFileName(doc.file);
      
      // Set headers cho download
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (err) {
      console.error('Lỗi khi tải xuống tài liệu:', err);
      req.session.errorMessage = 'Đã xảy ra lỗi khi tải xuống tài liệu.';
      res.redirect('/document');
    }
  }

  // Middleware xử lý file upload + kiểm tra lỗi
  handleUpload(req, res, next) {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        req.session.errorMessage = 'Lỗi upload tệp: ' + err.message;
        return res.redirect('/document');
      } else if (err) {
        req.session.errorMessage = 'Lỗi máy chủ: ' + err.message;
        return res.redirect('/document');
      }

      // Tiếp tục tới logic upload
      next();
    });
  }

  // Logic xử lý sau khi file đã được upload thành công
  async uploadDocument(req, res, next) {
    try {
      const userId = req.session?.user?._id;

      if (!userId || !req.file || !req.body.title) {
        req.session.errorMessage = 'Thiếu thông tin khi tải lên.';
        return res.redirect('/document');
      }

      const newDoc = new Document({
        username: userId,
        title: req.body.title,
        file: `${userId}/${req.file.filename}`
      });

      await newDoc.save();

      req.session.successMessage = 'Tải lên tài liệu thành công.';
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

  async previewFile(){
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File không tồn tại.');
    }

    // Lấy phần mở rộng để set Content-Type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.pdf': contentType = 'application/pdf'; break;
      case '.jpg':
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.png': contentType = 'image/png'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.txt': contentType = 'text/plain; charset=utf-8'; break;
      case '.doc': contentType = 'application/msword'; break;
      case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
      case '.xls': contentType = 'application/vnd.ms-excel'; break;
      case '.xlsx': contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
      case '.ppt': contentType = 'application/vnd.ms-powerpoint'; break;
      case '.pptx': contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline'); // Cho phép xem trực tiếp
    res.sendFile(filePath);
  }
}

module.exports = new DocumentController();
