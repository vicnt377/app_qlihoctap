const Video = require('../../models/Video');
const User = require('../../models/User');
const axios = require('axios');
const Notification = require('../../models/Notification');

// Hàm parse duration từ YouTube
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = duration.match(regex) || [];

  const h = hours ? `${hours} giờ` : '';
  const m = minutes ? `${minutes} phút` : '';
  const s = seconds ? `${seconds} giây` : '';

  return [h, m, s].filter(Boolean).join(' ').trim() || '0 giây';
}

class VideoController {
  async getVideo(req, res) {
    try {
      const userId = req.session.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      if (!user) return res.status(404).send('User not found');

      const allVideos = await Video.find({ category: user.major, daXoa: false }).lean();

      // Danh sách ID video đã tham gia
      const enrolledIds = Array.isArray(user.enrolledVideos)
        ? user.enrolledVideos
            .filter(v => v != null) // bỏ null
            .map(v => v.toString()) // convert an toàn
        : [];

      // Video đã tham gia
      const enrolledVideos = allVideos.filter(v => enrolledIds.includes(v._id.toString()));

      // Video chưa tham gia
      const notEnrolledVideos = allVideos.filter(v => !enrolledIds.includes(v._id.toString()));

      res.render('user/video', {
        user,
        enrolledVideos,
        notEnrolledVideos,
        enrolledCount: enrolledVideos.length,
        otherCount: notEnrolledVideos.length
      });

    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi máy chủ');
    }
  }

  async showDetail(req, res) {
    try {
      const userId = req.session.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();

      const videoId = req.params.id;
      const video = await Video.findById(videoId).lean();

      if (!video) return res.status(404).send("Không tìm thấy video");

    let enrolled = false;
    if (req.session?.user?._id) {
      const user = await User.findById(req.session.user._id);
      if (user && Array.isArray(user.enrolledVideos)) {
        enrolled = user.enrolledVideos.some(v => v && v.toString() === videoId);
      }
    }

      // Tính số học viên
      const studentsCount = await User.countDocuments({ enrolledVideos: videoId });

      // Tính rating trung bình
      let avgRating = 0;
      if (video.reviews && video.reviews.length > 0) {
        avgRating = (
          video.reviews.reduce((sum, r) => sum + r.rating, 0) /
          video.reviews.length
        ).toFixed(1);
      }

      res.render("user/detailVideo", {
        user,
        enrolled,
        video: {
          ...video,
          students: studentsCount,
          rating: avgRating
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi server!");
    }
  }

  async joinVideo(req, res) {
    try {
      // 1. Kiểm tra đăng nhập
      if (!req.session?.user?._id) {
        console.warn("joinVideo: user chưa đăng nhập");
        return res.redirect("/login-user");
      }

      const userId = req.session.user._id;
      const videoId = req.params.id;

      // 2. Cập nhật trực tiếp bằng $addToSet
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledVideos: videoId } }, // tránh trùng lặp
        { new: true }
      );

      if (!updatedUser) {
        console.warn("joinVideo: không tìm thấy user:", userId);
        return res.redirect("/login-user");
      }

      console.log(` User ${updatedUser.username} đã đăng ký video ${videoId}`);

      // 3. Lấy thông tin video để hiển thị trong notification
      const video = await Video.findById(videoId);

      // 4. Tạo notification cho user
      await Notification.create({
        recipient: userId,
        sender: userId, // hoặc để null nếu là hệ thống
        type: "success",
        title: "Bạn vừa quan tâm video",
        message: `Bạn đã theo dõi video "${video?.title}" thành công.`,
        relatedModel: "Video",
        relatedId: videoId,
        metadata: {
          videoId,
          videoTitle: video?.title
        }
      });

      // 5. Redirect
      res.redirect(`/video/showdetail/${videoId}`);
    } catch (error) {
      console.error("joinVideo error:", error);
      res.status(500).send("Lỗi server!");
    }
  }

  async postReview(req, res) {
    try {
      const { rating, comment } = req.body;
      const videoId = req.params.id;
      const user = req.session.user;

      const video = await Video.findById(videoId);
      if (!video) return res.status(404).send('Video không tồn tại');

      let isUpdate = false;
      const existingReview = video.reviews.find(
        r => r.user.toString() === user._id.toString()
      );

      if (existingReview) {
        // cập nhật review cũ
        existingReview.rating = Math.max(1, Math.min(5, parseInt(rating)));
        existingReview.comment = comment.trim();
        existingReview.createdAt = new Date();
        isUpdate = true;
      } else {
        // thêm mới
        video.reviews.push({
          user: user._id,
          username: user.username,
          rating: Math.max(1, Math.min(5, parseInt(rating))),
          comment: comment.trim(),
          createdAt: new Date()
        });
      }

      await video.save();

      //  Tạo notification
      await Notification.create({
        recipient: user._id,              // người nhận chính là user
        sender: user._id,                 // có thể là hệ thống hoặc user
        type: "info",
        title: isUpdate 
          ? "Bạn đã cập nhật đánh giá" 
          : "Cảm ơn bạn đã đánh giá",
        message: isUpdate 
          ? `Bạn đã cập nhật đánh giá cho video "${video.title}".`
          : `Bạn đã gửi đánh giá cho video "${video.title}".`,
        relatedModel: "Video",
        relatedId: video._id,
        metadata: {
          videoId: video._id,
          videoTitle: video.title,
          rating: parseInt(rating),
          comment: comment.trim()
        }
      });

      res.redirect(`/video/showdetail/${videoId}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server khi gửi đánh giá');
    }
  }

  async startVideo(req, res) {
    try {
      const userId = req.session.user._id;
      if (!userId) return res.redirect('/login-user');
      const user = await User.findById(userId).lean();


      const video = await Video.findById(req.params.id);
      if (!video) return res.status(404).send('Không tìm thấy video');

      // Lấy thông tin từ YouTube API
      const apiKey = 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';
      const youtubeId = video.youtubeId;

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=contentDetails&key=${apiKey}`;
      const response = await axios.get(apiUrl);

      const durationISO = response.data.items[0]?.contentDetails?.duration;
      const durationFormatted = parseDuration(durationISO);

      res.render('user/startVideo', {
        user,
        video: video.toObject(),
        duration: durationFormatted
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  }
  async saveProgress(req, res) {
    try {
      const videoId = req.params.id;
      const { currentTime, duration } = req.body;

      await Video.findByIdAndUpdate(videoId, {
        currentTime,
        duration,
        isCompleted: currentTime >= duration - 2
      });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.json({ success: false });
    }
  }

}

module.exports = new VideoController();
