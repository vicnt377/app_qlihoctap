const Handlebars = require('handlebars');
const path = require('path');

module.exports = {
  inc: (value) => parseInt(value) + 1,
  shortId: (id) => id ? id.toString().slice(-4) : '',
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  gte: (a, b) => a >= b,
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),
  not: (value) => !value,
  default: (value, fallback) => (value != null && !isNaN(value)) ? value : fallback,
  array: (...args) => args.slice(0, -1),
  toString: (val) => val?.toString(),
  calcPercent: (current, duration) => {
    if (!duration || duration == 0) return 0;

    return ((current / duration) * 100).toFixed(0);
  },
  isActive: (currentPath, matchPath) =>
    currentPath.startsWith(matchPath) ? "active" : "",

  thuToNumber: (thu) => ({
    'Thứ Hai': 1,
    'Thứ Ba': 2,
    'Thứ Tư': 3,
    'Thứ Năm': 4,
    'Thứ Sáu': 5,
    'Thứ Bảy': 6
  }[thu] || 1),

  formatStartTime: (gioHoc) => gioHoc?.split('-')[0]?.trim(),
  formatEndTime: (gioHoc) => gioHoc?.split('-')[1]?.trim(),

  getStartDate: (namHoc, tenHocKy) => {
    const startYear = namHoc?.split(' - ')[0];
    if (!startYear) return '2024-09-01';
    return tenHocKy?.includes('1')
      ? `${startYear}-09-01`
      : `${parseInt(startYear) + 1}-02-01`;
  },

  getEndDate: (namHoc, tenHocKy) => {
    const endYear = namHoc?.split(' - ')[1];
    if (!endYear) return '2025-01-31';
    return tenHocKy?.includes('1')
      ? `${endYear}-01-31`
      : `${endYear}-06-15`;
  },

  formatDate: (date, format) => {
    const d = new Date(date);
    if (!format || format === 'vi') {
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  addDays: (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  ifCond: function (v1, operator, v2, options) {
    switch (operator) {
      case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':   return (v1 < v2)   ? options.fn(this) : options.inverse(this);
      case '<=':  return (v1 <= v2)  ? options.fn(this) : options.inverse(this);
      case '>':   return (v1 > v2)   ? options.fn(this) : options.inverse(this);
      case '>=':  return (v1 >= v2)  ? options.fn(this) : options.inverse(this);
      default:    return options.inverse(this);
    }
  },

  times: (n, block) => {
    let accum = '';
    for (let i = 0; i < n; ++i) accum += block.fn(i);
    return accum;
  },

  queryString: (query) => new URLSearchParams(query).toString(),

  json: (context) => new Handlebars.SafeString(
    JSON.stringify(context, (k, v) => v === undefined ? null : v)
  ),

  range: (n) => {
    const num = parseInt(n);
    if (isNaN(num) || num < 0 || num > 100) return [];
    return Array.from({ length: num }, (_, i) => i);
  },

  rangeCategory: (start, end) => {
    start = Number(start);
    end = Number(end);
    let arr = [];

    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  },

  sanitize: (text) => typeof text === 'string' ? text.replace(/["']/g, '') : '',

  generateEvents: function (semesters) {
    const thuToNumber = this.thuToNumber;
    return semesters.flatMap(sem =>
      (sem.score || []).map(score => ({
        title: `${this.sanitize(score.HocPhan?.tenHocPhan)} (${this.sanitize(score.HocPhan?.maHocPhan)})`,
        daysOfWeek: [thuToNumber(score.thu)],
        startTime: score.gioBatDau,
        endTime: score.gioKetThuc,
        startRecur: sem.startDate?.toISOString().split('T')[0],
        endRecur: sem.endDate?.toISOString().split('T')[0],
      }))
    );
  },

  thumbnailIsUrl: (thumbnail) =>
    thumbnail && (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')),

  includes: (array, value) => array && array.includes(value.toString()),

  groupBy: (array, key) => {
    if (!Array.isArray(array)) return {};

    const groups = {};

    array.forEach(item => {
      // Nếu không có category, gán tạm là "Khác"
      const category = (item[key] || 'Khác').toString().trim();
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return groups;
  },

  countVideosInCategory: (videos, category) => {
    if (!Array.isArray(videos)) return 0;
    return videos.filter(v => (v.category || '').toLowerCase() === category.toLowerCase()).length;
  },

  majorName: (code) => {
    const majors = {
      'CNTT': 'Công nghệ thông tin',
      'YT': 'Y tế',
      'GD': 'Giáo dục',
      'NN': 'Ngoại ngữ',
      'TN-MT': 'Tự nhiên - Môi trường',
      'KT-TC': 'Kinh tế - Tài chính',
      'KD-QL': 'Kinh doanh - Quản lý',
      'KT-XD': 'Kỹ thuật - Xây dựng',
      'L-NV': 'Luật - Nhân văn',
      'ST-NT': 'Sáng tạo - Nghệ thuật',
      'DV-DL': 'Dịch vụ - Du lịch',
      'Khác': 'Danh mục khác',
    };
    return majors[code] || code;
  },
  
  lookup: (array, index) => (Array.isArray(array) && index >= 0 && index < array.length) ? array[index] : null,

  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileType: (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') return 'pdf';
    if (['.doc', '.docx'].includes(ext)) return 'doc';
    if (['.xls', '.xlsx'].includes(ext)) return 'xls';
    if (['.ppt', '.pptx'].includes(ext)) return 'ppt';
    if (['.jpg','.jpeg','.png','.gif','.bmp','.webp'].includes(ext)) return 'image';
    if (['.txt','.md','.json','.xml','.html','.css','.js'].includes(ext)) return 'text';
    return 'other';
  },

  getOriginalFileName: (filePath) => path.basename(filePath),

  getFileIcon: (doc) => {
    // Ưu tiên lấy từ originalName (file gốc)
    let ext = (doc.originalName || '').toLowerCase();
    if (ext.includes('.')) {
      ext = path.extname(ext).replace('.', '').toLowerCase();
    }

    switch (ext) {
      case 'pdf': return 'fas fa-file-pdf text-danger';
      case 'doc': case 'docx': return 'fas fa-file-word text-primary';
      case 'xls': case 'xlsx': return 'fas fa-file-excel text-success';
      case 'ppt': case 'pptx': return 'fas fa-file-powerpoint text-warning';
      case 'txt': return 'fas fa-file-alt text-secondary';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'webp':
        return 'fas fa-file-image text-info';
      default: return 'fas fa-file text-muted';
    }
  },


  paginate: (pagination, options) => {
    let out = '';
    for (let i = 1; i <= pagination.totalPages; i++) {
      out += options.fn({
        page: i,
        active: i === pagination.currentPage
      });
    }
    return out;
  },

  hasPrevPage: (pagination) => pagination.currentPage > 1,
  hasNextPage: (pagination) => pagination.currentPage < pagination.totalPages,


};
