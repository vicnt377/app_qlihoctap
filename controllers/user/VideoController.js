const Video = require('../../models/Video');
const User = require('../../models/User');
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
      // Cho phép xem video ngay cả khi chưa đăng nhập
      const userId = req.user?._id || req.session?.user?._id;

      // Lấy các tham số lọc từ query
      const { search, category, level } = req.query;
      
      // Xây dựng filter object
      let filter = { daXoa: false };
      
      // Lọc theo danh mục
      if (category && category !== 'all') {
        filter.category = category;
      }
      
      // Lọc theo cấp độ
      if (level && level !== 'all') {
        filter.level = level;
      }
      
      // Lọc theo từ khóa tìm kiếm
      if (search && search.trim()) {
        filter.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      // Lấy video từ database
      const rawVideos = await Video.find(filter).lean();
      console.log('Raw videos from database:', rawVideos.length);

      // Xử lý từng video để thêm thông tin cần thiết
      const videos = await Promise.all(rawVideos.map(async (video) => {
        try {
          // Lấy thời lượng từ YouTube API nếu cần
          const apiKey = 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${video.youtubeId}&part=contentDetails&key=${apiKey}`;
          const response = await axios.get(apiUrl);
          const durationISO = response.data.items[0]?.contentDetails?.duration;
          video.durationFormatted = parseDuration(durationISO);
        } catch (err) {
          console.error(`Lỗi lấy thời lượng video ${video.youtubeId}:`, err.message);
          // Sử dụng duration từ database nếu không lấy được từ YouTube
          video.durationFormatted = video.duration ? `${video.duration} giờ` : 'Không rõ';
        }
        
        // Thêm thông tin cần thiết cho giao diện
        video.levelColor = video.level === 'Cơ bản' ? 'success' : 
                         video.level === 'Trung bình' ? 'warning' : 'danger';
        video.students = 0; // Mặc định, có thể cập nhật sau
        video.rating = 'Chưa có'; // Mặc định, có thể cập nhật sau
        
        // Đảm bảo có đầy đủ thông tin từ database
        video.title = video.title || 'Không có tiêu đề';
        video.description = video.description || 'Không có mô tả';
        video.category = video.category || 'Khác';
        video.level = video.level || 'Cơ bản';
        video.lessons = video.lessons || 1;
        
        return video;
      }));

      // Lấy danh sách danh mục và cấp độ để hiển thị trong form
      const categories = await Video.distinct('category', { daXoa: false });
      const levels = ['Cơ bản', 'Trung bình', 'Nâng cao'];

      // Kiểm tra xem có video nào được tìm thấy không
      const hasResults = videos.length > 0;
      const totalResults = videos.length;
      
      // Gom nhóm theo category
      const groupedVideos = videos.reduce((groups, video) => {
        if (!groups[video.category]) {
          groups[video.category] = [];
        }
        groups[video.category].push(video);
        return groups;
      }, {});

      res.render('user/video', {
        user: req.session.user,
        videos,
        categories,
        levels,
        filters: { search: search || '', category: category || 'all', level: level || 'all' },
        hasResults,
        totalResults,
        groupedVideos
      });
    } catch (error) {
      next(error);
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
