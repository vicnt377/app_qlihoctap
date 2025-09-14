const libre = require('libreoffice-convert');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.user._id;
    const folder = path.join(__dirname, '../src/public/file', userId.toString());
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

function uploadAndConvert(req, res, next) {
  upload.single('file')(req, res, err => {
    if (err) return next(err);
    if (!req.file) return next();

    const ext = path.extname(req.file.originalname).toLowerCase();
    const officeExts = ['.doc','.docx','.xls','.xlsx','.ppt','.pptx'];

    if (officeExts.includes(ext)) {
      const inputPath = req.file.path;
      const outputPath = inputPath.replace(ext, '.pdf');
      const fileBuf = fs.readFileSync(inputPath);

      libre.convert(fileBuf, '.pdf', undefined, (err, done) => {
        if (err) return next(err);

        fs.writeFileSync(outputPath, done);
        fs.unlinkSync(inputPath); // xóa file gốc

        req.file.filename = path.basename(outputPath);
        req.file.path = outputPath;
        req.file.mimetype = 'application/pdf';
        next();
      });
    } else {
      next();
    }
  });
}

module.exports = uploadAndConvert;
