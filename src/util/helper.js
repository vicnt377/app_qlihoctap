const Handlebars = require('handlebars');


module.exports = {
  inc: (value) => parseInt(value) + 1,
  shortId: (id) => id ? id.toString().slice(-4) : '',
  eq: (a, b) => a === b,
  ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),
  default: (value, fallback) => (value != null && !isNaN(value)) ? value : fallback,

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

  formatDate: (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    }
};
