const User = require('../models/User');
const Course = require('../models/Course');
const Video = require('../models/Video')

class AdminController {

    login_admin(req, res) {
        res.render('auth/login-admin', {layout: "auth", error: null });
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log("Nhận dữ liệu:", username, password);

            const user = await User.findOne({ username });
            console.log("User tìm thấy:", user);

            if (!user || user.password !== password) {
                req.flash('error_msg', 'Tên đăng nhập hoặc mật khẩu không đúng!');
                return res.redirect('/admin/login-admin');
            }

            if (user.role !== 'admin') {
            req.flash('error_msg', 'Bạn không có quyền truy cập trang quản trị!');
            return res.redirect('/admin/login-admin');
            }
            // Lưu session
            req.session.user = {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role
            };
            req.session.userId = user._id;
            console.log("Lưu session:", req.session.user);

            res.redirect('/admin/dashboard');

        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).send("Lỗi máy chủ!");
        }
    }

//Dashboard--------------------------------------------------------------------------------------------------------------------
    async dashboard(req, res) {
        try {
            const [totalUsers, adminUsers, totalVideos, deletedVideos] = await Promise.all([
                User.countDocuments({ role: 'user'}),
                User.countDocuments({ role: 'admin' }),
                Video.countDocuments({}),
                Video.countDocuments({ daXoa: true })
            ]);

            const recentUsers = await User.find({role: 'user'})
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            const recentVideos = await Video.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            res.render('admin/dashboard', {
                user: req.session.user,
                layout: 'admin',
                stats: {
                    totalUsers,
                    adminUsers,
                    totalVideos,
                    deletedVideos
                },
                recentUsers,
                recentVideos
            });

        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Lỗi khi tải dashboard');
            res.redirect('/admin/login-admin');
        }
    }


    
// Người dùng ------------------------------------------------------------------------------------------------------------------------------------
    async getUsers(req, res) {
        try {
            const allUsers = await User.find({ role: 'user' });

            const students = allUsers.map(user => ({
            _id: user._id,
            name: user.username,
            email: user.email,
            createdAt: user.createdAt,
            isActive: true, // Giả định tất cả user đều đang hoạt động; bạn có thể sửa theo logic thực tế
            stats: {
                avgProgress: Math.floor(Math.random() * 100), // hoặc lấy từ CSDL nếu có
                completedCourses: Math.floor(Math.random() * 10), // hoặc lấy từ CSDL nếu có
            }
            }));

            // Thống kê nhanh
            const studentStats = {
            total: allUsers.length,
            active: allUsers.length, // Giả sử tất cả đang hoạt động, có thể đếm theo điều kiện khác nếu có field trạng thái
            newThisMonth: allUsers.filter(user => {
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                const createdAt = new Date(user.createdAt);
                return createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear;
            }).length,
            totalEnrollments: allUsers.length * 3, // Ví dụ: mỗi user trung bình có 3 đăng ký (tuỳ vào schema của bạn)
            };

            res.render('admin/users', {
            user: req.session.user,
            students,
            studentStats,
            layout: 'admin',
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi tải danh sách học viên');
        }
    }



// Học Phần ---------------------------------------------------------------------------------------------------------------------------------------
    async getCourses(req, res) {
        try {
        const users = await User.find();
        const courses = await Course.find(); // Lấy tất cả học phần

        res.render('admin/courses', {
            user: req.session.user,
            users,
            courses: JSON.stringify(courses), // truyền vào view
            layout: 'admin'
        });
        } catch (err) {
        res.status(500).send('Lỗi server');
        }
    }

    async createCourse(req, res) {
        try {
            const { maHocPhan, tenHocPhan, soTinChi } = req.body;

            // Kiểm tra đầu vào
            if (!maHocPhan || !tenHocPhan || !soTinChi) {
            return res.status(400).json({ message: 'Thiếu thông tin học phần.' });
            }

            // Kiểm tra trùng mã học phần
            const existed = await Course.findOne({ maHocPhan });
            if (existed) {
            return res.status(409).json({ message: 'Mã học phần đã tồn tại.' });
            }

            // Tạo học phần mới
            const newCourse = new Course({
            maHocPhan,
            tenHocPhan,
            soTinChi: Number(soTinChi),
            daXoa: false,
            });

            await newCourse.save();

            return res.status(201).json(newCourse);
        } catch (error) {
            console.error("Lỗi khi tạo học phần:", error);
            return res.status(500).json({ message: 'Lỗi server khi tạo học phần.' });
        }
    }

    async editCourse(req, res) {
        try {
            const { maHocPhan, tenHocPhan, soTinChi } = req.body;
            const { id } = req.params;

            await Course.findByIdAndUpdate(id, {
                maHocPhan,
                tenHocPhan,
                soTinChi,
            });

            res.sendStatus(200); // Thành công
        } catch (err) {
            console.error("Lỗi khi cập nhật học phần:", err);
            res.sendStatus(500); // Lỗi server
        }
    }


    async deleteCourse(req, res) {
        try {
            await Course.findByIdAndUpdate(req.params.id, { daXoa: true });
            res.sendStatus(200);
        } catch (err) {
            res.sendStatus(500);
        }
    }

    async restoreCourse(req, res) {
        try {
            const courseId = req.params.id;
            const updated = await Course.findByIdAndUpdate(courseId, { daXoa: false });

            if (!updated) {
            return res.status(404).send("Học phần không tồn tại");
            }

            res.status(200).send("Khôi phục thành công");
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khôi phục học phần");
        }
    }



//Video--------------------------------------------------------------------------------------------------------------------------------------------------------
    async getVideos(req, res) {
        try {
        const users = await User.find();
        const videos = await Video.find(); // Lấy tất cả học phần

        res.render('admin/videos', {
            user: req.session.user,
            users,
            videos, // truyền vào view
            layout: 'admin'
        });
        } catch (err) {
        res.status(500).send('Lỗi server');
        }
    }

    async createVideo(req, res) {
        try {
            const { title, youtubeId, description } = req.body;
            const video = new Video({ title, youtubeId, description });
            await video.save();
            res.status(201).json({ message: 'Video đã được tạo', video });
        } catch (error) {
            console.error('Lỗi tạo video:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async editVideo(req, res) {
        try {
            const { title, description, youtubeId } = req.body;
            const { id } = req.params;

            await Video.findByIdAndUpdate(id, {
                title,
                description,
                youtubeId,
            });

            res.sendStatus(200); // Thành công
        } catch (err) {
            console.error("Lỗi khi cập nhật video:", err);
            res.sendStatus(500); // Lỗi server
        }
    }

    async deleteVideo(req, res) {
        try {
            await Video.findByIdAndUpdate(req.params.id, { daXoa: true });
            res.sendStatus(200);
        } catch (err) {
            res.sendStatus(500);
        }
    }

}

module.exports = new AdminController();
