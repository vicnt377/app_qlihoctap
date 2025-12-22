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
  'laHocPhanDieuKien',
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

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'có', 'co'].includes(v);
  }

  return false;
}

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

      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let data = XLSX.utils.sheet_to_json(sheet);

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

      // ✅ KIỂM TRA & CHUẨN HÓA DỮ LIỆU
      data = data.map((row, index) => {
        for (const field of REQUIRED_COLUMNS) {
          if (
            row[field] === undefined ||
            row[field] === null ||
            row[field] === ''
          ) {
            fs.unlinkSync(filePath);
            throw new Error(`Dòng ${index + 2} thiếu dữ liệu "${field}"`);
          }
        }

        return {
          maHocPhan: row.maHocPhan.toString().trim(),
          tenHocPhan: row.tenHocPhan.toString().trim(),
          soTinChi: Number(row.soTinChi),
          laHocPhanDieuKien: parseBoolean(row.laHocPhanDieuKien)
        };
      });

      req.excelData = data;
      next();

    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  });
};

