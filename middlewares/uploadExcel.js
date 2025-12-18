const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// ================== CẤU HÌNH ==================
const uploadDir = path.join(__dirname, '../public/course');

const REQUIRED_COLUMNS = [
  'maHocPhan',
  'tenHocPhan',
  'soTinChi',
];

// ================== TẠO THƯ MỤC ==================
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================== MULTER STORAGE ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'course-import-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel';

    if (ok) cb(null, true);
    else cb(new Error('Chỉ cho phép file Excel (.xlsx, .xls)'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('excelFile');

// ================== MIDDLEWARE CHÍNH ==================
module.exports = (req, res, next) => {
  upload(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Chưa upload file Excel' });
    }

    try {
      const filePath = req.file.path;

      // Đọc Excel
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      if (data.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: 'File Excel không có dữ liệu' });
      }

      // ✅ KIỂM TRA CỘT
      const firstRow = data[0];
      const missingColumns = REQUIRED_COLUMNS.filter(
        col => !(col in firstRow)
      );

      if (missingColumns.length > 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: 'File Excel thiếu cột bắt buộc',
          missingColumns
        });
      }

      // ✅ KIỂM TRA DỮ LIỆU TỪNG DÒNG
      for (let i = 0; i < data.length; i++) {
        for (const field of REQUIRED_COLUMNS) {
          if (
            data[i][field] === undefined ||
            data[i][field] === null ||
            data[i][field] === ''
          ) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
              message: `Dòng ${i + 2} thiếu dữ liệu trường "${field}"`
            });
          }
        }
      }

      // 👉 Gắn data vào req để controller dùng
      req.excelData = data;
      next();

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi đọc hoặc kiểm tra file Excel' });
    }
  });
};
