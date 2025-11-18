const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../../models/User');
const Video = require('../../models/Video');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';

// ===== Helper: Chuyển đổi chuỗi thời lượng ISO8601 (PT#M#S) từ API sang định dạng dễ đọc
function parseDuration(durationStr) {
  if (!durationStr) return '0m 0s';
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0m 0s';
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
}

class VideoController {
  //  1. Lấy danh sách video (admin/videos) — hỗ trợ AJAX lọc / tìm kiếm
  async getVideos(req, res) {
    try {
      const { search = '', sort = 'newest', page = 1, category = '', ajax } = req.query;

      // --------------------------
      // 1) BỘ LỌC
      // --------------------------
      const filter = { daXoa: false };
      if (search.trim()) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (category && category !== 'all') filter.category = category;

      // --------------------------
      // 2) SẮP XẾP
      // --------------------------
      let sortOption = { createdAt: -1 };
      if (sort === 'oldest') sortOption = { createdAt: 1 };
      if (sort === 'az') sortOption = { title: 1 };
      if (sort === 'za') sortOption = { title: -1 };

      // --------------------------
      // 3) LẤY DANH SÁCH VIDEO
      // --------------------------
      const videos = await Video.find(filter).sort(sortOption).lean();

      // --------------------------
      // 4) TÍNH SỐ HỌC VIÊN
      // --------------------------
      const videoIds = videos.map(v => v._id);
      const enrollCounts = await User.aggregate([
        { $match: { enrolledVideos: { $in: videoIds } } },
        { $unwind: '$enrolledVideos' },
        { $match: { enrolledVideos: { $in: videoIds } } },
        { $group: { _id: '$enrolledVideos', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      enrollCounts.forEach(i => countMap[i._id.toString()] = i.count);

      // --------------------------
      // 5) TÍNH RATING TRUNG BÌNH
      // --------------------------
      videos.forEach(video => {
        const reviews = video.reviews || [];
        const avg = reviews.length
          ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
          : 0;

        video.rating = Number(avg.toFixed(1));
        video.students = countMap[video._id.toString()] || 0;
      });

      // --------------------------
      // 6) DANH MỤC
      // --------------------------
      const allMajors = {
        'CNTT': 'Công nghệ thông tin',
        'YT': 'Y tế',
        'GD': 'Giáo dục',
        'NN': 'Ngoại ngữ',
        'TN-MT': 'Tự nhiên - Môi trường',
        'KT-TC': 'Kinh tế - Tài chính',
        'KD-QL': 'Kinh doanh - Quản lý',
        'KT-XD': 'Kỹ thuật - Xây dựng',
        'L-NV': 'Luật - Nhân văn',
        'ST-NT': 'Sáng tạo - Nghệ thuật',
        'DV-DL': 'Dịch vụ - Du lịch'
      };

      const categories = Object.keys(allMajors);

      // --------------------------
      // 7) PHÂN TRANG DANH MỤC
      // --------------------------

      // Phân trang hiện tại
      const categoryPerPage = 1;
      let currentPage = parseInt(req.query.page) || 1;

      const totalPages = Math.ceil(categories.length / categoryPerPage);

      if (currentPage < 1) currentPage = 1;
      if (currentPage > totalPages) currentPage = totalPages;

      const startIndex = (currentPage - 1) * categoryPerPage;
      const paginatedCategories = categories.slice(startIndex, startIndex + categoryPerPage);

      const groupedActive = {};
      for (const cat of paginatedCategories) {
        groupedActive[cat] = await Video.find({ category: cat, daXoa: false })
          .sort(sortOption)
          .lean();
      }

      // Lấy toàn bộ video đã xóa
      const allDeletedVideos = await Video.find({ daXoa: true })
        .sort({ createdAt: -1 })
        .lean();

      // Lấy danh mục duy nhất từ video đã xóa
      const deletedCategories = [...new Set(allDeletedVideos.map(v => v.category))];

      // Phân trang theo danh mục
      const deletedCategoryPerPage = 1;
      let deletedPage = parseInt(req.query.deletedPage) || 1;

      const deletedTotalPages = Math.ceil(deletedCategories.length / deletedCategoryPerPage);

      if (deletedPage < 1) deletedPage = 1;
      if (deletedPage > deletedTotalPages) deletedPage = deletedTotalPages;

      const startDeletedIndex = (deletedPage - 1) * deletedCategoryPerPage;

      // Lấy danh mục thuộc trang hiện tại
      const paginatedDeletedCategories = deletedCategories.slice(
        startDeletedIndex,
        startDeletedIndex + deletedCategoryPerPage
      );

      // Nhóm video đã xóa theo danh mục của trang
      const groupedDelete = {};

      for (const cat of paginatedDeletedCategories) {
        groupedDelete[cat] = allDeletedVideos.filter(v => v.category === cat);
      }



      console.log("Deleted categories:", deletedCategories);
      console.log("Page:", deletedPage);
      console.log("Categories in this page:", paginatedDeletedCategories);
      console.log("Grouped delete:", groupedDelete);


      // --------------------------
      // 11) RENDER TRANG CHÍNH
      // --------------------------
      if (req.query.ajaxDeleted === "1") {
        return res.json({
          groupedDelete,
          deletedPage,
          deletedTotalPages
        });
      }
      res.render('admin/videos', {
        layout: 'admin',
        user: req.session.user,
        // Active
        videos,
        groupedActive,
        categories,
        currentPage,
        totalPages,

        // Deleted
        allDeletedVideos,
        groupedDelete,
        deletedCategories,
        deletedPage,
        deletedTotalPages,

        query: { search, sort, category }
      });


    } catch (err) {
      console.error("❌ Lỗi getVideos:", err);
      res.status(500).send("Lỗi server khi lấy danh sách video");
    }
  }


  //  2. Tìm kiếm video trên YouTube (preview)
  async searchAndPreview(req, res) {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Thiếu từ khóa' });

    try {
      const isId = /^[\w-]{11}$/.test(query);
      let videoInfo;

      if (isId) {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { key: YOUTUBE_API_KEY, id: query, part: 'snippet,contentDetails' },
        });
        const item = response.data?.items?.[0];
        if (!item) return res.status(404).json({ message: 'Không tìm thấy video theo ID' });

        videoInfo = {
          youtubeId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
          duration: parseDuration(item.contentDetails.duration),
        };
      } else {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { key: YOUTUBE_API_KEY, q: query, part: 'snippet', type: 'video', maxResults: 1 },
        });
        const item = response.data?.items?.[0];
        if (!item) return res.status(404).json({ message: 'Không tìm thấy video theo từ khóa' });

        videoInfo = {
          youtubeId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
        };
      }

      res.json({ video: videoInfo });
    } catch (err) {
      console.error('Lỗi tìm video YouTube:', err?.response?.data || err.message);
      res.status(500).json({ message: 'Lỗi khi tìm video từ YouTube' });
    }
  }

  //  3. Tạo video mới
  async createVideo(req, res) {
    try {
      const { youtubeId, title, description, thumbnail, category, duration = '0m 0s' } = req.body;

      const exists = await Video.findOne({ youtubeId });
      if (exists) return res.status(400).json({ message: 'Video đã tồn tại' });

      const video = new Video({
        youtubeId,
        title,
        description,
        thumbnail,
        category,
        duration,
        daXoa: false,
      });

      await video.save();
      res.status(201).json({ message: '✅ Đã thêm video mới', video });
    } catch (err) {
      console.error('❌ Lỗi tạo video:', err);
      res.status(500).json({ message: 'Thêm video thất bại' });
    }
  }

  //  4. Chỉnh sửa video
  async editVideo(req, res) {
    try {
      const { id } = req.params;
      const { youtubeId, title, description, category } = req.body;
      const updateData = { title, description, category };

      if (youtubeId) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
        const resYT = await axios.get(apiUrl);
        const item = resYT.data.items?.[0];
        if (item) {
          updateData.thumbnail = item.snippet.thumbnails?.medium?.url;
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

  //  5. Xóa mềm video
  async deleteVideo(req, res) {
    try {
      await Video.findByIdAndUpdate(req.params.id, { daXoa: true });
      res.status(200).json({ message: 'Đã xóa video (ẩn khỏi danh sách)' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi khi xóa video!' });
    }
  }

  // 6. XÓA VĨNH VIỄN VIDEO
  async deletePermanentVideo(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Video.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy video để xóa." });
      }

      return res.status(200).json({ message: "Xóa vĩnh viễn thành công!" });

    } catch (err) {
      console.error("❌ Lỗi deletePermanentVideo:", err);
      return res.status(500).json({ message: "Lỗi server khi xóa vĩnh viễn." });
    }
  }


  //  7. Khôi phục video
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
