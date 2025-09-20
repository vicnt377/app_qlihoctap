const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { spawn } = require('child_process');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session?.user?._id || req.session.userId;
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
  upload.single('file')(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    const ext = path.extname(req.file.originalname).toLowerCase();
    const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

    // Nếu file là Office → thử convert bằng spawn
    if (officeExts.includes(ext)) {
      try {
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(ext, '.pdf');

        console.log("📂 Spawn LibreOffice convert:", inputPath);

        // Gọi soffice trực tiếp
        const soffice = spawn(
          'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
          [
            '--headless',              // chạy ẩn
            '--convert-to', 'pdf',     // convert sang PDF
            '--outdir', path.dirname(inputPath), // folder xuất file
            inputPath
          ]
        );

        soffice.on('error', (e) => {
          console.error("❌ Lỗi khi gọi soffice:", e.message);
          return next(); // fallback: giữ file gốc
        });

        soffice.on('exit', (code) => {
          if (code === 0 && fs.existsSync(outputPath)) {
            console.log("✅ Convert thành công:", outputPath);

            // Xoá file gốc, thay req.file thành PDF
            fs.unlinkSync(inputPath);
            req.file.filename = path.basename(outputPath);
            req.file.path = outputPath;
            req.file.mimetype = 'application/pdf';
            next();
          } else {
            console.error("⚠️ Convert thất bại, giữ file gốc:", inputPath);
            next(); // fallback: giữ file gốc
          }
        });
      } catch (convErr) {
        console.error("⚠️ Exception khi convert:", convErr.message);
        next(); // fallback
      }
    } else {
      next(); // không phải Office file → giữ nguyên
    }
  });
}

module.exports = uploadAndConvert;
