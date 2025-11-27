const User = require('../../models/Admin');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

class StatisticController {
    async statistic(req, res) {
        try {

            // ========== 1) Tổng học viên ==========
            const totalUsers = await User.countDocuments({ role: "user" });

            // ========== 2) Tổng khóa học ==========
            const totalVideos = await Video.countDocuments({ daXoa: false });

            // ========== 3) Tổng lượt đăng ký video ==========
            const totalEnrollments = await User.aggregate([
                { $unwind: "$enrolledVideos" },
                { $count: "total" }
            ]);
            const totalRegisters = totalEnrollments[0]?.total || 0;

            // ========== 4) Khóa học hoàn thành (VD: >=70% review rating) ==========
            const completedVideos = await Video.countDocuments({
                reviews: { $exists: true, $not: { $size: 0 } },
            });

            // ========== 5) Tiến độ trung bình (giả sử dựa trên % video có review) ==========
            const averageProgress = totalVideos > 0
                ? Math.round((completedVideos / totalVideos) * 100)
                : 0;

            // ========== 6) Dữ liệu tăng trưởng T0 → T5 (giả lập từ User.createdAt) ==========
            const growth = await User.aggregate([
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                        total: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Format lại 12 tháng gần nhất (T0 – T11)
            const growthMonths = Array.from({ length: 12 }, (_, i) => ({
                label: `T${i+1}`,
                value: growth[i+1]?.total || 0
            }));

            res.render("admin/statistic", {
                layout: "admin",

                // ---- Dashboard numbers ----
                totalUsers,
                totalVideos,
                totalRegisters,
                completedVideos,
                averageProgress,

                // ---- Growth data (T0 → T5) ----
                growthMonths
            });

        } catch (err) {
            console.error("❌ Lỗi lấy thống kê:", err);
            res.render("admin/statistic", {
                layout: "admin",
                error: "Không thể tải dữ liệu thống kê!"
            });
        }
    }
}
module.exports = new StatisticController();