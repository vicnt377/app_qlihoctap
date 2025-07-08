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
            const { search, status } = req.query;

            let filter = { role: 'user' };

            if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ username: regex }, { email: regex }];
            }

            // Giả sử bạn lưu trạng thái người dùng theo logic riêng (ví dụ: active = true/false)
            if (status === 'active') filter.isActive = true;
            else if (status === 'inactive') filter.isActive = false;

            // Truy vấn danh sách học viên
            const allUsers = await User.find(filter);

            // Xây dựng mảng học viên
            const students = allUsers.map(user => ({
            _id: user._id,
            name: user.username,
            email: user.email,
            createdAt: user.createdAt,
            isActive: user.isActive ?? true, // fallback nếu chưa có trường isActive
            stats: {
                avgProgress: Math.floor(Math.random() * 100),
                completedCourses: Math.floor(Math.random() * 10),
            }
            }));

            const now = new Date();
            const studentStats = {
            total: students.length,
            active: students.filter(s => s.isActive).length,
            newThisMonth: students.filter(s => {
                const d = new Date(s.createdAt);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length,
            totalEnrollments: students.reduce((sum, s) => sum + s.stats.completedCourses, 0),
            };

            res.render('admin/users', {
            user: req.session.user,
            students,
            studentStats,
            layout: 'admin',
            query: { search, status }
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
        const { search = '', sort = 'newest', page = 1 } = req.query;
        const limit = 10;
        const currentPage = parseInt(page);

        // Lọc video chưa bị xóa
        const filter = { daXoa: false };

        // Lọc theo tiêu đề hoặc mô tả
        if (search.trim()) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
        }

        // Sắp xếp
        let sortOption = { createdAt: -1 }; // mặc định: mới nhất
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        else if (sort === 'az') sortOption = { title: 1 };
        else if (sort === 'za') sortOption = { title: -1 };

        // Tổng số video
        const totalVideos = await Video.countDocuments(filter);

        // Lấy video theo trang
        const videos = await Video.find(filter)
        .sort(sortOption)
        .skip((currentPage - 1) * limit)
        .limit(limit);

        const users = await User.find();

        res.render('admin/videos', {
        layout: 'admin',
        user: req.session.user,
        users,
        videos,
        currentPage,
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos,
        query: { search, sort }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
    }


    async createVideo(req, res) {
        try {
            const {
                title, youtubeId, description,
                thumbnail, category, level, rating, duration,lessons,students,instructor,
            } = req.body;

            const video = new Video({
                title,youtubeId,description, thumbnail, category, level,
                rating, duration, lessons,  students, instructor,
            });

            await video.save();
            res.status(201).json({ message: 'Video đã được tạo', video });
        } catch (error) {
            console.error('Lỗi tạo video:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }


    async editVideo(req, res) {
        try {
            const { title, youtubeId, description,
                thumbnail, category, level, rating, duration,lessons,students,instructor, } = req.body;
            const { id } = req.params;

            await Video.findByIdAndUpdate(id, {
                title, youtubeId, description,
                thumbnail, category, level, rating, duration,lessons,students,instructor,
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

//Báo cáo thông kê-------------------------------------------------------------------------------------------------------------
    statistic(req, res) {
        res.render('admin/statistic', {layout: "admin", error: null });
    }
}

module.exports = new AdminController();
