const Video = require('../models/Video');
const User = require('../models/User');

class VideoController {
  async getVideo(req, res, next) {
    try {
      const userId = req.user?._id || req.session?.user?._id;
      if (!userId) {
        return res.render('auth/login');
      }

      const videos = await Video.find().sort({ createdAt: -1 });

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


}

module.exports = new VideoController();
