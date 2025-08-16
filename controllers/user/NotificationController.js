
const User = require('../../models/User');
const Notification = require('../../models/Notification'); // Sử dụng model từ thư mục models
const { mongooseToObject } = require('../../src/util/mongoose');

class NotificationController {
    // ✅ Lấy danh sách thông báo của user
    async getUserNotifications(req, res) {
        try {
            // Disable cache cho API notifications
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Last-Modified': new Date().toUTCString()
            });

            // Debug: Log request info
            console.log('🔍 getUserNotifications called:', {
                hasUser: !!req.user,
                userKeys: req.user ? Object.keys(req.user) : [],
                userId: req.user?._id,
                sessionUser: req.session?.user?._id,
                timestamp: new Date().toISOString()
            });

            if (!req.user || !req.user._id) {
                console.error('❌ req.user is undefined or missing _id');
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated or session expired'
                });
            }

            const userId = req.user._id;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;
            
            const query = { 
                recipient: userId, 
                isDeleted: false 
            };
            
            if (unreadOnly === 'true') {
                query.isRead = false;
            }
            
            const notifications = await Notification.find(query)
                .populate('sender', 'username avatar')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean();
            
            // Đếm tổng số thông báo
            const total = await Notification.countDocuments(query);
            
            // Đếm số thông báo chưa đọc
            const unreadCount = await Notification.countDocuments({
                recipient: userId,
                isRead: false,
                isDeleted: false
            });
            
            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    },
                    unreadCount
                }
            });
        } catch (error) {
            console.error('Error getting user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông báo'
            });
        }
    }

    // ✅ Đánh dấu thông báo đã đọc
    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            const userId = req.user._id;
            
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: userId,
                isDeleted: false
            });
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông báo'
                });
            }
            
            await notification.markAsRead();
            
            res.json({
                success: true,
                message: 'Đã đánh dấu thông báo đã đọc'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đánh dấu thông báo'
            });
        }
    }

    // ✅ Đánh dấu tất cả thông báo đã đọc
    async markAllAsRead(req, res) {
        try {
            const userId = req.user._id;
            
            await Notification.updateMany(
                { 
                    recipient: userId, 
                    isRead: false, 
                    isDeleted: false 
                },
                { isRead: true }
            );
            
            res.json({
                success: true,
                message: 'Đã đánh dấu tất cả thông báo đã đọc'
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đánh dấu thông báo'
            });
        }
    }

    // ✅ Xóa thông báo
    async deleteNotification(req, res) {
        try {
            const { notificationId } = req.params;
            const userId = req.user._id;
            
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: userId,
                isDeleted: false
            });
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông báo'
                });
            }
            
            await notification.markAsDeleted();
            
            res.json({
                success: true,
                message: 'Đã xóa thông báo'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa thông báo'
            });
        }
    }

    // ✅ Tạo thông báo mới (cho admin hoặc system)
    async createNotification(req, res) {
        try {
            const { recipientId, title, message, type, relatedModel, relatedId, metadata } = req.body;
            const senderId = req.user._id;
            
            // Kiểm tra quyền tạo thông báo
            const sender = await User.findById(senderId);
            if (!sender || !sender.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền tạo thông báo'
                });
            }
            
            const notification = await Notification.create({
                recipient: recipientId,
                sender: senderId,
                title,
                message,
                type: type || 'info',
                relatedModel: relatedModel || 'System',
                relatedId,
                metadata
            });
            
            // Populate sender info
            await notification.populate('sender', 'username avatar');
            
            res.status(201).json({
                success: true,
                data: notification
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo thông báo'
            });
        }
    }

    // ✅ Tạo thông báo cho nhiều người dùng
    async createMultipleNotifications(req, res) {
        try {
            const { recipientIds, title, message, type, relatedModel, relatedId, metadata } = req.body;
            const senderId = req.user._id;
            
            // Kiểm tra quyền
            const sender = await User.findById(senderId);
            if (!sender || !sender.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền tạo thông báo'
                });
            }
            
            const notifications = await Notification.createForMultipleRecipients(
                recipientIds,
                senderId,
                title,
                message,
                type || 'info',
                relatedModel || 'System',
                relatedId,
                metadata
            );
            
            res.status(201).json({
                success: true,
                data: {
                    count: notifications.length,
                    notifications
                }
            });
        } catch (error) {
            console.error('Error creating multiple notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo thông báo'
            });
        }
    }

    // ✅ Lấy thống kê thông báo
    async getNotificationStats(req, res) {
        try {
            const userId = req.user._id;
            
            const stats = await Notification.aggregate([
                {
                    $match: {
                        recipient: userId,
                        isDeleted: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        unread: { $sum: { $cond: ['$isRead', 0, 1] } },
                        byType: {
                            $push: {
                                type: '$type',
                                count: 1
                            }
                        }
                    }
                }
            ]);
            
            const result = stats[0] || { total: 0, unread: 0, byType: [] };
            
            // Nhóm theo type
            const byType = {};
            result.byType.forEach(item => {
                byType[item.type] = (byType[item.type] || 0) + item.count;
            });
            
            res.json({
                success: true,
                data: {
                    total: result.total,
                    unread: result.unread,
                    byType
                }
            });
        } catch (error) {
            console.error('Error getting notification stats:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê thông báo'
            });
        }
    }

    // ✅ Methods cũ để tương thích ngược
    async getNotifications(req, res) {
        return this.getUserNotifications(req, res);
    }

    async loadMoreNotifications(req, res) {
        return this.getUserNotifications(req, res);
    }
}

module.exports = new NotificationController();