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

const session = require("express-session");   // ✅ thêm
const flash = require("connect-flash");       // ✅ thêm

const app = express();
const port = process.env.PORT || 3000;

// Middleware custom
app.use(methodOverride('_method'));

// ⚡ Socket.IO setup
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);
app.set('io', io);

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

// 🔌 Kết nối MongoDB
const db = require('../config/database/db');
db.connect();

// Middleware chung
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ✅ Session + Flash setup */
app.use(
  session({
    secret: "secret_key_clerk",   // 👉 đổi thành chuỗi bảo mật riêng
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// ✅ Inject flash messages vào res.locals (để view hbs sử dụng)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Handlebars setup
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

handlebars.registerHelper('shortId', function (id) {
  if (id && typeof id.toString === 'function') {
    const idString = id.toString();
    return idString.substring(idString.length - 4);
  }
  return '';
});

// Routes
const route = require('../routes');
route(app);

// Debug route
app.get('/debug-auth', (req, res) => {
  res.json(req.auth || { message: 'Chưa đăng nhập Clerk' });
});

// 🚀 Start server
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
