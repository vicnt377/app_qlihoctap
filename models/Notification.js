// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'welcome', 'system'], 
    default: 'info' 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedModel: { 
    type: String, 
    enum: ['System','User', 'Document', 'Course', 'Video', 'Chat', 'Progress', 'Score'], 
    default: 'System' 
  },
  relatedId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, {
  timestamps: true
});

// ✅ Virtual để tính thời gian tương đối
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
});

// ✅ Method để đánh dấu đã đọc
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// ✅ Method để đánh dấu đã xóa
notificationSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  return this.save();
};

// ✅ Static method để tạo thông báo hệ thống
notificationSchema.statics.createSystemNotification = function(recipientId, title, message, type = 'info', metadata = {}) {
  return this.create({
    recipient: recipientId,
    sender: recipientId, // System notification có sender = recipient
    type,
    title,
    message,
    relatedModel: 'System',
    metadata
  });
};

// ✅ Static method để tạo thông báo cho nhiều người
notificationSchema.statics.createForMultipleRecipients = function(recipientIds, senderId, title, message, type = 'info', relatedModel = 'System', relatedId = null, metadata = {}) {
  const notifications = recipientIds.map(recipientId => ({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    relatedModel,
    relatedId,
    metadata
  }));

  return this.insertMany(notifications);
};

// ✅ Index để tối ưu query
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, isDeleted: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
