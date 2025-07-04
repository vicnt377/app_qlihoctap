const Video = require('../models/Video');

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
}

module.exports = new VideoController();
