const Video = require('../models/Video');
const User = require('../models/User');
const axios = require('axios');

// Hàm chuyển đổi định dạng ISO 8601 thành chuỗi dễ hiểu
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = duration.match(regex) || [];
  return `${hours ? `${hours} giờ ` : ''}${minutes ? `${minutes} phút ` : ''}${seconds ? `${seconds} giây` : ''}`.trim();
}

class VideoController {
  async getVideo(req, res, next) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('auth/login');
      }

      const rawVideos = await Video.find({
        daXoa: false,
        category: 'YouTube'
      }).lean();

      const apiKey = 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';

      const videos = await Promise.all(rawVideos.map(async (video) => {
        try {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${video.youtubeId}&part=contentDetails&key=${apiKey}`;
          const response = await axios.get(apiUrl);
          const durationISO = response.data.items[0]?.contentDetails?.duration;
          video.durationFormatted = parseDuration(durationISO);
        } catch (err) {
          console.error(`Lỗi lấy thời lượng video ${video.youtubeId}:`, err.message);
          video.durationFormatted = 'Không rõ';
        }
        return video;
      }));

      res.render('user/video', {
        user: req.session.user,
        videos,
      });
    } catch (error) {
      next(error);
    }
  }

  async showDetail(req, res, next) {
        try {
        const video = await Video.findById(req.params.id);
        const user = req.session.user;

        let enrolled = false;
        if (user && user.role === 'user') {
            const foundUser = await User.findById(user._id);
            enrolled = foundUser.enrolledVideos.includes(video._id);
        }

        res.render('user/detailVideo', {
          user: req.session.user,
          video: video.toObject(), 
          enrolled,
        });
    } catch (error) {
        res.status(404).send('Không tìm thấy video!');
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
          video,
          duration: durationFormatted
        });
      } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server');
      }
    }




}

module.exports = new VideoController();
