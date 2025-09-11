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
const port = process.env.PORT || 3000;

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
app.set('io', io);

// Lưu map userId -> socketId
const userSockets = new Map();
io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  socket.on('register', ({ userId }) => {
    userSockets.set(userId, socket.id);
    console.log(`📌 Registered: ${userId} -> ${socket.id}`);
  });

  socket.on('chatMessage', async ({ senderId, receiverId, message }) => {
    if (!message?.trim()) return;
    await Message.create({ sender: senderId, receiver: receiverId, content: message });

    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', { senderId, message });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`🔌 Disconnected: ${userId}`);
        break;
      }
    }
  });
});

/* ============================================================
   3. ⚙️ Middleware chung
============================================================ */
app.use(morgan('combined'));                              // log HTTP request
app.use(express.static(path.join(__dirname, 'public')));  // phục vụ file tĩnh
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
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
