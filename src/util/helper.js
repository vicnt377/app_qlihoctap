const Handlebars = require('handlebars');


module.exports = {
  inc: (value) => parseInt(value) + 1,
  shortId: (id) => id ? id.toString().slice(-4) : '',
  eq: (a, b) => a === b,
  ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),
  default: (value, fallback) => (value != null && !isNaN(value)) ? value : fallback,
  array: (...args) => args.slice(0, -1),
  toString: (val) => val.toString(), 

  thuToNumber: function (thu) {
    const map = {
        'Thứ Hai': 1,
        'Thứ Ba': 2,
        'Thứ Tư': 3,
        'Thứ Năm': 4,
        'Thứ Sáu': 5,
        'Thứ Bảy': 6
    };
    return map[thu] || 1;
    },

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
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }

    // format === 'yyyy-MM-dd'
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },


  addDays: (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  ifCond: function (v1, operator, v2, options) {
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

  times: function(n, block) {
    let accum = '';
    for (let i = 0; i < n; ++i) accum += block.fn(i);
    return accum;
  },

  queryString: function (query) {
    const params = new URLSearchParams(query);
    return params.toString();
  },

    json: function (context) {
    return new Handlebars.SafeString(
      JSON.stringify(context, (key, value) => value === undefined ? null : value)
    );
  },

    range:  function(n){
        const num = parseInt(n);
        if (isNaN(num) || num < 0 || num > 100) return [];
        return Array.from({ length: num }, (_, i) => i);
    },

    sanitize: (text) => (typeof text === 'string' ? text.replace(/["']/g, '') : ''),

    generateEvents: function (semesters) {
      const sanitize = this.sanitize;
      const thuToNumber = this.thuToNumber;
      return semesters.flatMap(sem =>
        (sem.score || []).map(score => ({
          title: `${sanitize(score.HocPhan?.tenHocPhan)} (${sanitize(score.HocPhan?.maHocPhan)})`,
          daysOfWeek: [thuToNumber(score.thu)],
          startTime: score.gioBatDau,
          endTime: score.gioKetThuc,
          startRecur: sem.startDate?.toISOString().split('T')[0],
          endRecur: sem.endDate?.toISOString().split('T')[0],
        }))
      );
    },

    thumbnailIsUrl: function (thumbnail) {
      return thumbnail &&
       (thumbnail.startsWith('http://') || thumbnail.startsWith('https://'));
    },

    includes: function (array, value) {
      return array && array.includes(value.toString());
    },

    groupBy: function (array, key) {
      if (!array || !Array.isArray(array)) return {};
      
      // Lọc bỏ các item có category null/undefined/empty
      const validArray = array.filter(item => item && item[key] && item[key].toString().trim() !== '');
      
      // Gộp các danh mục tương tự
      const normalizedGroups = {};
      
      validArray.forEach(item => {
        let groupKey = item[key].toString().trim();
        
        // Chuẩn hóa tên danh mục
        if (groupKey.toLowerCase().includes('backend')) {
          groupKey = 'Backend';
        } else if (groupKey.toLowerCase().includes('frontend')) {
          groupKey = 'Frontend';
        } else if (groupKey.toLowerCase().includes('lập trình') || groupKey.toLowerCase().includes('lap trinh')) {
          groupKey = 'Lập trình';
        }
        
        // Loại bỏ các từ thừa như "2 khóa học", "khóa học", etc.
        groupKey = groupKey.replace(/\s*\d+\s*khóa học\s*/gi, '').trim();
        groupKey = groupKey.replace(/\s*khóa học\s*/gi, '').trim();
        
        if (!normalizedGroups[groupKey]) {
          normalizedGroups[groupKey] = [];
        }
        normalizedGroups[groupKey].push(item);
      });
      
      return normalizedGroups;
    },

    lookup: function (array, index) {
      if (!array || !Array.isArray(array) || index < 0 || index >= array.length) return null;
      return array[index];
    },

    // Helper để đếm tổng số video trong một danh mục
    countVideosInCategory: function (videos, category) {
      if (!videos || !Array.isArray(videos)) return 0;
      return videos.filter(video => {
        const videoCategory = video.category?.toString().toLowerCase() || '';
        return videoCategory.includes(category.toLowerCase());
      }).length;
    }

};
