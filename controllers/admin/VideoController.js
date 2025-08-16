const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const match = durationStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return +(hours + minutes / 60 + seconds / 3600).toFixed(2);
}

function mapLevel(level) {
  const levels = {
    beginner: 'Cơ bản',
    intermediate: 'Trung bình',
    advanced: 'Nâng cao'
  };
  return levels[level] || 'Cơ bản'; // fallback nếu không khớp
}

class VideoController {
    async getVideos(req, res) {
      try {
        const { search = '', sort = 'newest', page = 1, category = '', level = '' } = req.query;
        const limit = 10;
        const currentPage = parseInt(page);

        // ===== Bộ lọc chung
        const baseFilter = {};
        if (search.trim()) {
          baseFilter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ];
        }

        // ===== Lọc theo danh mục
        if (category && category !== 'all') {
          baseFilter.category = category;
        }

        // ===== Lọc theo cấp độ
        if (level && level !== 'all') {
          baseFilter.level = level;
        }

        // ===== Sort
        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        else if (sort === 'az') sortOption = { title: 1 };
        else if (sort === 'za') sortOption = { title: -1 };

        // ===== Videos chưa xóa
        const filter = { ...baseFilter, daXoa: false };
        const totalVideos = await Video.countDocuments(filter);

        const videos = await Video.find(filter)
          .sort(sortOption)
          .skip((currentPage - 1) * limit)
          .limit(limit)
          .lean();

        // ===== Đếm số học viên
        const videoIds = videos.map(v => v._id);
        const enrollCounts = await User.aggregate([
          { $match: { enrolledVideos: { $in: videoIds } } },
          { $unwind: '$enrolledVideos' },
          { $match: { enrolledVideos: { $in: videoIds } } },
          { $group: { _id: '$enrolledVideos', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        enrollCounts.forEach(item => {
          countMap[item._id.toString()] = item.count;
        });

        videos.forEach(video => {
          video.students = countMap[video._id.toString()] || 0;
          const reviews = video.reviews || [];
          video.rating = reviews.length === 0
            ? 'Chưa có'
            : (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1);
        });

        // ===== Videos đã xóa (không phân trang)
        const deletedVideos = await Video.find({ ...baseFilter, daXoa: true })
          .sort({ deletedAt: -1 }) // nếu có deletedAt, hoặc giữ nguyên
          .lean();

        // Lấy danh sách danh mục và cấp độ để hiển thị trong bộ lọc
        const categories = await Video.distinct('category', { daXoa: false });
        const levels = ['Cơ bản', 'Trung bình', 'Nâng cao'];

        res.render('admin/videos', {
          layout: 'admin',
          user: req.session.user,
          users: await User.find(),
          videos, // chưa xóa
          deletedVideos, // đã xóa
          currentPage,
          totalPages: Math.ceil(totalVideos / limit),
          totalVideos,
          categories,
          levels,
          query: { search, sort, category, level },
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
      }
    }

    async searchAndPreview(req, res) {
      const { query } = req.query;
      if (!query) return res.status(400).json({ message: 'Thiếu từ khóa' });

      try {
        const isId = /^[\w-]{11}$/.test(query);
        let videoInfo;

        if (isId) {
          const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
              key: YOUTUBE_API_KEY,
              id: query,
              part: 'snippet,contentDetails',
            },
          });

          const items = response.data?.items || [];
          if (items.length === 0) return res.status(404).json({ message: 'Không tìm thấy video theo ID' });

          const item = items[0];
          videoInfo = {
            youtubeId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            duration: parseDuration(item.contentDetails.duration),
          };
        } else {
          const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              key: YOUTUBE_API_KEY,
              q: query,
              part: 'snippet',
              type: 'video',
              maxResults: 1,
            },
          });

          const items = response.data?.items || [];
          if (items.length === 0) return res.status(404).json({ message: 'Không tìm thấy video theo từ khóa' });

          const item = items[0];
          videoInfo = {
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
          };
        }

        res.json({ video: videoInfo });
      } catch (err) {
        console.error('Lỗi tìm video YouTube:', err?.response?.data || err.message);
        res.status(500).json({ message: 'Lỗi khi tìm video từ YouTube' });
      }
    }

    async fetchVideosBySearch(req, res) {
        const { q = 'lap trinh', maxResults = 10 } = req.query;

        try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
            key: YOUTUBE_API_KEY,
            part: 'snippet',
            q,
            type: 'video',
            maxResults,
            }
        });

        const videos = response.data.items.map(item => ({
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
        }));

        res.json({ videos });
        } catch (error) {
        console.error('Lỗi khi lấy video từ YouTube:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi khi lấy video từ YouTube' });
        }
    }

    async createVideo(req, res) {
      try {
        const {
          youtubeId,
          title,
          description,
          thumbnail,
          level,
          category,
          duration = '0m 0s'
        } = req.body;

        const exists = await Video.findOne({ youtubeId });
        if (exists) return res.status(400).json({ message: 'Video đã tồn tại' });

        const durationInHours = parseDuration(duration); // chuyển đổi chuỗi sang số

        const video = new Video({
          youtubeId,
          title,
          description,
          thumbnail,
          level: mapLevel(level),
          category,
          duration: durationInHours,
          lessons: 1,
          daXoa: false
        });

        await video.save();
        res.status(201).json({ message: 'Đã thêm video', video });
      } catch (err) {
        console.error('❌ Lỗi tạo video:', err);
        res.status(500).json({ message: 'Thêm video thất bại' });
      }
    }

    async editVideo(req, res) {
      try {
        const { id } = req.params;
        const {
          youtubeId,
          title,
          description,
          category,
          level,
        } = req.body;

        const updateData = {
          title,
          description,
          category,
          level,
        };

        // Nếu cần cập nhật từ YouTube
        if (youtubeId) {
          const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=snippet,contentDetails&key=${apiKey}`;
          const response = await axios.get(apiUrl);
          const item = response.data.items[0];

          if (item) {
            // Chỉ cập nhật những trường không nhập thủ công (ví dụ thumbnail, instructor, duration)
            updateData.thumbnail = item.snippet.thumbnails?.medium?.url;
            updateData.instructor = item.snippet.channelTitle;
            updateData.duration = parseDuration(item.contentDetails.duration);
          }
        }

        await Video.findByIdAndUpdate(id, updateData);
        res.sendStatus(200);
      } catch (err) {
        console.error('Lỗi khi cập nhật video:', err);
        res.sendStatus(500);
      }
    }

    async deleteVideo(req, res) {
        try {
            await Video.findByIdAndUpdate(req.params.id, { daXoa: true });
            return res.status(200).json({ message: 'Xóa khóa học thành công !!!' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa video!' });
        }
    }

    async restoreVideo(req, res) {
      try {
        await Video.findByIdAndUpdate(req.params.id, { daXoa: false });
        res.sendStatus(200);
      } catch (err) {
        console.error(err);
        res.sendStatus(500);
      }
    }

}
module.exports = new VideoController();