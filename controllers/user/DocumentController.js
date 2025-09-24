const mongoose = require('mongoose');
const Document = require('../../models/Document');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const path = require('path');
const fs = require('fs');
const upload = require('../../middlewares/uploadFile'); // multer + convert

class DocumentController {
  // Hiển thị danh sách tài liệu
  async getDocument(req, res, next) {
    try {
      const userId = req.session.userId || req.session?.user?._id;
      
      if (!userId) {
        return res.redirect('/login-user');
      }
      
      const user = await User.findById(userId).lean();
        if (!user) {
          return res.redirect('/login-user');
        }

      const q = req.query.q || '';
      const regex = new RegExp(q, 'i');

      const documents = await Document.find({
        user: userId,
        title: { $regex: regex }
      }).sort({ createdAt: -1 });

      const referenceDocs = await Document.find({
        visibility: 'public',
        user: { $ne: userId },
        title: { $regex: regex }
      }).populate('user', 'username');

      const successMessage = req.session.successMessage || null;
      const errorMessage = req.session.errorMessage || null;
      req.session.successMessage = null;
      req.session.errorMessage = null;

      res.render('user/document', {
        user,
        documents,
        referenceDocs,
        query: q,
        successMessage,
        errorMessage
      });
    } catch (err) {
      next(err);
    }
  }

  // Middleware xử lý upload
  handleUpload(req, res, next) {
    upload(req, res, (err) => {
      if (err) {
        req.session.errorMessage = err.message || 'Upload thất bại.';
        return res.redirect('/document');
      }
      next();
    });
  }

  // Lưu tài liệu mới
  async uploadDocument(req, res, next) {
    try {
      const userId = req.session?.user?._id;
      if (!userId || !req.file || !req.body.title) {
        req.session.errorMessage = 'Thiếu thông tin khi tải lên.';
        return res.redirect('/document');
      }

      const visibility = req.body.visibility === 'public' ? 'public' : 'private';

      const newDoc = new Document({
        user: new mongoose.Types.ObjectId(userId),
        title: req.body.title,
        file: `${userId}/${req.file.filename}`,
        originalName: req.file.originalname,
        fileType: path.extname(req.file.filename).replace('.', ''),
        fileSize: req.file.size,
        visibility,
      });

      await newDoc.save();
      
      // ✅ Tạo thông báo upload
      try {
        const uploadNotification = new Notification({
          recipient: userId,
          sender: userId,
          type: 'success',
          title: 'Tài liệu mới đã được tải lên',
          message: `Bạn đã tải lên tài liệu "${newDoc.title}".`,
          relatedModel: 'Document',
          relatedId: newDoc._id,
          isRead: false,
          metadata: {
            action: 'upload',
            documentTitle: newDoc.title,
            timestamp: new Date()
          }
        });

        await uploadNotification.save();
        if (req.io) {
          req.io.to(userId.toString()).emit('new-notification', uploadNotification);
        }
        console.log("🔔 Thông báo upload:", uploadNotification);
      } catch (notifyErr) {
        console.error("❌ Lỗi tạo thông báo upload:", notifyErr);
      }
      
      req.session.successMessage = 'Tải lên tài liệu thành công.';
      res.redirect('/document');
    } catch (err) {
      console.error('❌ Upload error:', err);
      next(err);
    }
  }



// Xem trước file

async previewFile(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).send('Không tìm thấy tài liệu.');

    const filePath = path.join(__dirname, '../../src/public/file', doc.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File không tồn tại.');
    }

    const ext = path.extname(filePath).toLowerCase();

    // Gán Content-Type tự động theo ext
    res.type(ext);

    // Quan trọng: bắt buộc inline để iframe hiển thị
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + encodeURIComponent(doc.originalName) + '"'
    );

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
}

  // Download file
  async downloadDocument(req, res, next) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).send('Không tìm thấy tài liệu.');

      const filePath = path.join(__dirname, '../../src/public/file', doc.file);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File không tồn tại.');
      }

      res.download(filePath, doc.originalName || 'download');

      // ✅ Tạo thông báo tải xuống
      try {
        const downloadNotification = new Notification({
          recipient: req.session.user._id,
          sender: req.session.user._id,
          type: 'info',
          title: 'Bạn vừa tải xuống tài liệu',
          message: `Bạn đã tải xuống "${doc.title}".`,
          relatedModel: 'Document',
          relatedId: doc._id,
          isRead: false,
          metadata: {
            action: 'download',
            documentTitle: doc.title,
            timestamp: new Date()
          }
        });

        await downloadNotification.save();
        if (req.io) {
          req.io.to(req.session.user._id.toString())
            .emit('new-notification', downloadNotification.toObject());
        }
        console.log("Thông báo tải xuống:", downloadNotification);
      } catch (notifyErr) {
        console.error("❌ Lỗi tạo thông báo download:", notifyErr);
      }

    } catch (err) {
      next(err);
    }
  }

  // Xóa tài liệu
  async deleteDocument(req, res, next) {
    try {
      const docId = req.params.id;
      const document = await Document.findById(docId);

      if (!document) {
        req.flash('errorMessage', 'Không tìm thấy tài liệu.');
        return res.redirect('/document');
      }

      // Đường dẫn file đã lưu (PDF hoặc file gốc)
      const filePath = path.join(__dirname, '../../src/public/file', document.file);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Nếu file gốc là Office đã được convert → xóa luôn file Office còn sót (phòng trường hợp người dùng copy trực tiếp vào thư mục)
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.pdf') {
        const baseName = path.basename(filePath, '.pdf');
        const folderPath = path.dirname(filePath);

        const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        officeExts.forEach(ext => {
          const possiblePath = path.join(folderPath, baseName + ext);
          if (fs.existsSync(possiblePath)) {
            fs.unlinkSync(possiblePath);
          }
        });
      }

      // Xóa Document trong DB
      await Document.findByIdAndDelete(docId);
      // ✅ Tạo thông báo xóa
      try {
        const deleteNotification = new Notification({
          recipient: req.session.user._id,
          sender: req.session.user._id,
          type: 'warning',
          title: 'Tài liệu đã bị xóa',
          message: `Bạn đã xóa tài liệu "${document.title}".`,
          relatedModel: 'Document',
          relatedId: document._id,
          isRead: false,
          metadata: {
            action: 'delete',
            documentTitle: document.title,
            timestamp: new Date()
          }
        });

        await deleteNotification.save();
        if (req.io) {
          req.io.to(req.session.user._id.toString())
            .emit('new-notification', deleteNotification.toObject());
        }
        console.log("🔔 Thông báo xóa:", deleteNotification);
      } catch (notifyErr) {
        console.error("❌ Lỗi tạo thông báo xóa:", notifyErr);
      }

      req.flash('successMessage', 'Đã xóa tài liệu thành công.');
      res.redirect('/document');
    } catch (err) {
      console.error('Xóa tài liệu lỗi:', err);
      req.flash('errorMessage', 'Có lỗi xảy ra khi xóa tài liệu.');
      res.redirect('/document');
    }
  }

}

module.exports = new DocumentController();
