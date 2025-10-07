const Video = require('../../models/Video');
const User = require('../../models/User');
const axios = require('axios');
const Notification = require('../../models/Notification');

// Hàm parse duration từ YouTube
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = duration.match(regex) || [];
  return `${hours ? `${hours} giờ ` : ''}${minutes ? `${minutes} phút ` : ''}${seconds ? `${seconds} giây` : ''}`.trim();
}


class VideoController {
  async getVideo(req, res) {
    try {
      const userId = req.session.user?._id;
      if (!userId) return res.redirect('/login-user');

      const user = await User.findById(userId).lean();
      if (!user) return res.status(404).send('User not found');

      // Dùng major code trong User để query Video
      const videos = await Video.find({ category: user.major, daXoa: false }).lean();

      res.render('user/video', {
        user,
        videos,
        videoCount: videos.length,
      });

    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi máy chủ');
    }
  }

  async showDetail(req, res, next) {
    try {
      const video = await Video.findById(req.params.id);
      if (!video) {
        return res.status(404).send('Không tìm thấy video!');
      }

      const user = req.session.user;
      let enrolled = false;
      
      if (user && user.role === 'user') {
        try {
          const foundUser = await User.findById(user._id);
          enrolled = foundUser?.enrolledVideos?.includes(video._id) || false;
        } catch (err) {
          console.error('Lỗi khi kiểm tra enrollment:', err);
          enrolled = false;
        }
      }

      res.render('user/detailVideo', {
        user: req.session.user,
        video: video.toObject(), 
        enrolled,
      });
    } catch (error) {
      console.error('Lỗi khi hiển thị chi tiết video:', error);
      res.status(500).send('Lỗi server!');
    }
  }

  async joinVideo(req, res) {
    try {
      const userId = req.session.user._id;
      const videoId = req.params.id;

      const user = await User.findById(userId);

      if (!user.enrolledVideos.includes(videoId)) {
        user.enrolledVideos.push(videoId);
        await user.save();
      }

      res.redirect(`/video/showdetail/${videoId}`);
    } catch (error) {
      console.error(error);
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

      // Thêm đánh giá
      video.reviews.push({
        user: user._id,
        username: user.username,
        rating: parseInt(rating),
        comment,
        createdAt: new Date()
      });

      await video.save();

      res.redirect(`/video/showdetail/${videoId}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server khi gửi đánh giá');
    }
  }

  async startVideo(req, res) {
    try {
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
        video: video.toObject(),
        duration: durationFormatted
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  }
}

module.exports = new VideoController();
