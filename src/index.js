require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const handlebars = require('handlebars');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const helpers = require('./util/helper');
const Message = require('../models/Message');

const session = require("express-session");   // ✅ quản lý session
const flash = require("connect-flash");       // ✅ thông báo flash

const app = express();

/* ============================================================
   1. 🔌 Kết nối MongoDB
============================================================ */
const db = require('../config/database/db');
db.connect();

//xóa thông báo cũ
// Sau khi kết nối MongoDB thành công
require("../middlewares/notificationCleanup");

/* ============================================================
   2. ⚡️ HTTP server + Socket.IO setup
============================================================ */
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);

// ⚡️ Gọi file socket đã tách riêng
require('../config/socket/socket')(io);

app.set('io', io);

/* ============================================================
   3. ⚙️ Middleware chung
============================================================ */
app.use(morgan('combined'));                              // log HTTP request
app.use(express.static(path.join(__dirname, 'public')));  // phục vụ file tĩnh
// Cho phép truy cập trực tiếp /file/...
app.use('/file', express.static(path.join(__dirname, 'public/file')));
app.use('/course', express.static(path.join(__dirname, 'public/course')));
app.use(express.urlencoded({ extended: true }));          // parse form
app.use(express.json());                                  // parse JSON
app.use(methodOverride('_method'));                       // hỗ trợ PUT, DELETE

/* ============================================================
   4. 🗂️ Session + Flash setup (⚠️ PHẢI đặt trước khi dùng req.session)
============================================================ */
app.use(
  session({
    secret: "secret_key_clerk",   // 👉 nên để biến môi trường riêng
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

/* ============================================================
   5. 🖌️ Inject dữ liệu vào res.locals để dùng trong HBS
============================================================ */
app.use((req, res, next) => {
  res.locals.alertMessage = req.session.alertMessage || null;
  delete req.session.alertMessage; // clear sau khi show
  next();
});

app.use((req, res, next) => {
  // Navbar active tab
  res.locals.currentPath = req.path;

  // connect-flash messages
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");

  // custom session message
  res.locals.successMessage = req.session.successMessage || null;
  res.locals.errorMessage = req.session.errorMessage || null;

  // clear session message sau khi render
  delete req.session.successMessage;
  delete req.session.errorMessage;

  next();
});

/* ============================================================
   6. 🔧 Handlebars setup
============================================================ */
app.engine(
  '.hbs',
  engine({
    extname: '.hbs',
    handlebars: allowInsecurePrototypeAccess(handlebars),
    helpers,
  })
);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'resources/views/'));

// helper ví dụ: cắt id ngắn gọn
handlebars.registerHelper('shortId', function (id) {
  if (id && typeof id.toString === 'function') {
    const idString = id.toString();
    return idString.substring(idString.length - 4);
  }
  return '';
});

/* ============================================================
   7. 🚏 Routes
============================================================ */
const route = require('../routes');
route(app);

// Debug route để test session/auth
app.get('/debug-auth', (req, res) => {
  res.json(req.auth || { message: 'Chưa đăng nhập Clerk' });
});

/* ============================================================
   8. 🚀 Start server
============================================================ */
const port = 3000;
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
