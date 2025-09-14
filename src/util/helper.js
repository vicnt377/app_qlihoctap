const Handlebars = require('handlebars');
const path = require('path');

module.exports = {
  inc: (value) => parseInt(value) + 1,
  shortId: (id) => id ? id.toString().slice(-4) : '',
  eq: (a, b) => a === b,
  ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),

  default: (value, fallback) => (value != null && !isNaN(value)) ? value : fallback,
  array: (...args) => args.slice(0, -1),
  toString: (val) => val?.toString(),

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

  ifCond: (v1, operator, v2, options) => {
    switch (operator) {
      case '===': return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '!==': return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case '<': return v1 < v2 ? options.fn(this) : options.inverse(this);
      case '<=': return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case '>': return v1 > v2 ? options.fn(this) : options.inverse(this);
      case '>=': return v1 >= v2 ? options.fn(this) : options.inverse(this);
      default: return options.inverse(this);
    }
  },

  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,

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
    if (!array || !Array.isArray(array)) return {};
    const validArray = array.filter(item => item && item[key] && item[key].toString().trim() !== '');
    const normalizedGroups = {};
    validArray.forEach(item => {
      let groupKey = item[key].toString().trim();
      if (groupKey.toLowerCase().includes('backend')) groupKey = 'Backend';
      else if (groupKey.toLowerCase().includes('frontend')) groupKey = 'Frontend';
      else if (groupKey.toLowerCase().includes('lập trình') || groupKey.toLowerCase().includes('lap trinh')) groupKey = 'Lập trình';
      groupKey = groupKey.replace(/\s*\d+\s*khóa học\s*/gi, '').replace(/\s*khóa học\s*/gi, '').trim();
      if (!normalizedGroups[groupKey]) normalizedGroups[groupKey] = [];
      normalizedGroups[groupKey].push(item);
    });
    return normalizedGroups;
  },

  lookup: (array, index) => (Array.isArray(array) && index >= 0 && index < array.length) ? array[index] : null,

  countVideosInCategory: (videos, category) =>
    (videos || []).filter(v => (v.category?.toString().toLowerCase() || '').includes(category.toLowerCase())).length,

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
  }
};
