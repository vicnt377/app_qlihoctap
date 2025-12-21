const User = require('../../models/Admin');
const Video = require('../../models/Video');
const pdf = require('html-pdf-node');

class StatisticController {
    async statistic(req, res) {
        try {
            const { from, to } = req.query;

            // ====== Date filter ======
            const dateFilter = {};
            if (from || to) {
                dateFilter.createdAt = {};
                if (from) dateFilter.createdAt.$gte = new Date(from);
                if (to) dateFilter.createdAt.$lte = new Date(to);
            }

            // ====== Tổng học viên (không tính admin) ======
            const totalUsers = await User.countDocuments({
                role: "user",
                ...dateFilter
            });

            // ====== Tổng video ======
            const totalVideos = await Video.countDocuments({ daXoa: false });

            // ====== Tổng lượt đăng ký (enrolledVideos) ======
            const totalRegisters = await User.aggregate([
                { $match: { role: "user", ...dateFilter }},  // lọc user
                { $unwind: "$enrolledVideos" },
                { $count: "total" }
            ]).then(r => r[0]?.total || 0);

            // ====== Video có review (xem như hoàn thành) ======
            const completedVideos = await Video.countDocuments({
                reviews: { $exists: true, $not: { $size: 0 } }
            });

            const averageProgress = totalVideos > 0
                ? Math.round((completedVideos / totalVideos) * 100)
                : 0;

            // ====== Growth by month (chỉ học viên) ======
            const growth = await User.aggregate([
                { $match: { role: "user" }},
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                        total: { $sum: 1 }
                    }
                }
            ]);

            const growthMonths = Array.from({ length: 12 }, (_, i) => ({
                label: `T${i + 1}`,
                value: growth.find(m => m._id === i + 1)?.total || 0
            }));

            const growthLabels = growthMonths.map(m => m.label);
            const growthValues = growthMonths.map(m => m.value);

            // ====== Thống kê chuyên ngành (CHỈ user, KHÔNG đếm admin) ======
            const majorStats = await User.aggregate([
                { $match: { role: "user" }},   //  lọc user
                {
                    $group: {
                        _id: "$major",
                        total: { $sum: 1 }
                    }
                }
            ]);

            const majorLabels = majorStats.map(m => m._id || "Không xác định");
            const majorValues = majorStats.map(m => m.total);

            // ====== Render ======
            res.render("admin/statistic", {
                layout: "admin",
                totalUsers,
                totalVideos,
                totalRegisters,
                completedVideos,
                averageProgress,
                growthLabels,
                growthValues,
                majorLabels,
                majorValues,
                from,
                to
            });

        } catch (err) {
            console.error(" Lỗi thống kê:", err);
            res.render("admin/statistic", {
                layout: "admin",
                error: "Không thể tải dữ liệu thống kê"
            });
        }
    }

    // ====================== EXPORT PDF ======================
    async exportPDF(req, res) {
        try {
            const html = `
                <h1>BÁO CÁO THỐNG KÊ HỆ THỐNG</h1>
                <p>Ngày xuất: ${new Date().toLocaleString()}</p>
                <p>Tổng học viên: ${req.query.totalUsers}</p>
                <p>Tổng video: ${req.query.totalVideos}</p>
                <p>Tổng đăng ký: ${req.query.totalRegisters}</p>
                <p>Video hoàn thành: ${req.query.completedVideos}</p>
                <p>Tiến độ trung bình: ${req.query.averageProgress}%</p>
            `;

            const file = { content: html };

            const pdfBuffer = await pdf.generatePdf(file, {
                format: 'A4'
            });

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=baocao.pdf",
            });

            res.send(pdfBuffer);

        } catch (err) {
            console.error("❌ Lỗi xuất PDF:", err);
            res.status(500).send("Không thể xuất PDF!");
        }
    }
}

module.exports = new StatisticController();
