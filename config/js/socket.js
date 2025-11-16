// app/config/js/socket.js
const Message = require('../../models/Message');

module.exports = function (io) {

  // Map userId -> socketId
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('🟢 New socket connected:', socket.id);

    socket.on('register', ({ userId }) => {
      userSockets.set(userId, socket.id);
      console.log(`📌 Registered: ${userId} -> ${socket.id}`);
    });

    socket.on('chatMessage', async ({ senderId, receiverId, message }) => {
      if (!message?.trim()) return;

      await Message.create({
        sender: senderId,
        receiver: receiverId,
        content: message
      });

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

  return io;
  window.socket = window.socket || io();

};

