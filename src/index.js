const path = require('path');
const express = require('express');
const morgan = require('morgan');
const handlebars = require('handlebars');
const { engine } = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const helpers = require('./util/helper');
const Message = require('../models/Message');
const User = require('../models/User');
const { setUserLocals } = require('../middlewares/setUserLocals');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002; // Changed to 3002 to avoid conflicts
app.use(setUserLocals);

app.use(methodOverride('_method'));

// ⚙️ Khởi tạo HTTP server & Socket.IO
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

// 📌 Lưu mapping giữa userId và socketId
const userSockets = new Map(); // userId => socketId

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  // ✅ Khi client đăng ký kết nối bằng userId
  socket.on('register', ({ userId }) => {
    userSockets.set(userId, socket.id);
    console.log(`📌 Registered: ${userId} -> ${socket.id}`);
  });

  // ✅ Gửi tin nhắn giữa 2 người (user ↔ admin)
  socket.on('chatMessage', async ({ senderId, receiverId, message }) => {
    if (!message?.trim()) return;

    // Lưu DB
    await Message.create({ sender: senderId, receiver: receiverId, content: message });

    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', { senderId, message });
    }
  });

  // ✅ Khi client ngắt kết nối
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



// 🔌 Kết nối MongoDB
const db = require('../config/database/db');
db.connect();

// Middleware chung
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/file', express.static(path.join(__dirname, 'public/file')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handlebars setup
app.engine('.hbs', engine({
  extname: '.hbs',
  handlebars: allowInsecurePrototypeAccess(handlebars),
  helpers
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'resources/views/'));

// Session & Flash
app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});
app.use((req, res, next) => {
  res.locals.message = req.query.message || null;
  next();
});
app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage;
  res.locals.errorMessage = req.session.errorMessage;
  delete req.session.successMessage;
  delete req.session.errorMessage;
  next();
});

// Handlebars custom helper
handlebars.registerHelper('shortId', function(id) {
  if (id && typeof id.toString === 'function') {
    const idString = id.toString(); 
    return idString.substring(idString.length - 4);
  }
  return '';
});

// Định tuyến
const route = require('../routes');
route(app);

// 🚀 Bắt đầu server (phải dùng server.listen thay vì app.listen)
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
