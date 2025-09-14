const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../src/public/img');
    fs.mkdirSync(uploadPath, { recursive: true }); // Đảm bảo folder tồn tại
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
  const ext = path.extname(file.originalname);
  const userId = req.session?.user?._id || Date.now(); // fallback nếu chưa login
  cb(null, `${userId}${ext}`);
}

});

const uploadImg = multer({ storage });

module.exports = uploadImg;
