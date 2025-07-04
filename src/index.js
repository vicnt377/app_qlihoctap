const path = require('path')
const express = require('express')
const morgan = require('morgan')
const handlebars = require ('handlebars')
const { engine } = require('express-handlebars')
const session = require('express-session')
const flash = require('connect-flash')
const eflash = require('express-flash')
const bodyParser = require('body-parser')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const mongoose = require ('mongoose')

const app = express()
const port = 3100

const db = require('../config/database/db')
db.connect()

app.use(morgan('combined'))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/img', express.static(path.join(__dirname, 'public/img')))

app.use('/file', express.static(path.join(__dirname, 'public/file')));


app.engine('.hbs', engine({
  extname: '.hbs',
  handlebars: allowInsecurePrototypeAccess(handlebars),
  helpers: {
    inc: (value) => parseInt(value) + 1,
    shortId: (id) => id ? id.toString().slice(-4) : '',
    eq: (a, b) => a === b,
    ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),
    default: (value, fallback) => (value != null && !isNaN(value)) ? value : fallback,

    // ✅ Helper chuyển "Thứ 2" thành số (0 là CN, 1 là Thứ 2,...)
    thuToNumber: (thu) => {
      const map = {
        'Chủ Nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2,
        'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6
      };
      return map[thu] ?? 1;
    },

    // ✅ Helper tách giờ bắt đầu/kết thúc
    formatStartTime: (gioHoc) => gioHoc?.split('-')[0]?.trim(),
    formatEndTime: (gioHoc) => gioHoc?.split('-')[1]?.trim(),

    // ✅ Helper lấy ngày bắt đầu học kỳ
    getStartDate: (namHoc, tenHocKy) => {
      const startYear = namHoc?.split(' - ')[0];
      if (!startYear) return '2024-09-01';
      return tenHocKy?.includes('1')
        ? `${startYear}-09-01`
        : `${parseInt(startYear) + 1}-02-01`;
    },

    // ✅ Helper lấy ngày kết thúc học kỳ
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
    }

  }
}));


app.set('view engine', '.hbs') 
app.set('views',  path.join(__dirname, 'resources/views/'))


app.use(express.urlencoded({
  extended: true
}))

app.use(express.json())

app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }
}));

handlebars.registerHelper('shortId', function(id) {
  if (id && typeof id.toString === 'function') {
    const idString = id.toString(); 
    return idString.substring(idString.length - 4)
  }
  return ''
});

// Middleware để truyền flash messages đến views
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    next();
});
app.use((req, res, next) => {
  res.locals.message = req.query.message || null
  next();
});


app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  res.locals.errorMessage = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  next();
});





const route = require('../routes')
route(app)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})