const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Danh sách các định dạng được phép
const allowedFileTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx/;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.session?.user?._id || req.user?._id;
    if (!userId) {
      return cb(new Error('User ID is missing'), null);
    }

    const folderPath = path.join(__dirname, '../src/public/file', userId.toString());
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Lọc file theo định dạng
const fileFilter = function (req, file, cb) {
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file Word, Excel, PDF, hoặc trình chiếu.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

module.exports = upload;
