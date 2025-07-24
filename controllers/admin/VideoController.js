const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video')
require('dotenv').config();
const axios = require('axios');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function parseDuration(isoDuration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);

  const hours = parseInt(matches[1]) || 0;
  const minutes = parseInt(matches[2]) || 0;
  const seconds = parseInt(matches[3]) || 0;

  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
}

class VideoController {
    async getVideos(req, res) {
    try {
        const { search = '', sort = 'newest', page = 1 } = req.query;
        const limit = 10;
        const currentPage = parseInt(page);

        const filter = { daXoa: false };
        if (search.trim()) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        else if (sort === 'az') sortOption = { title: 1 };
        else if (sort === 'za') sortOption = { title: -1 };

        const totalVideos = await Video.countDocuments(filter);

        const videos = await Video.find(filter)
        .sort(sortOption)
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .lean();

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

        const users = await User.find();

        res.render('admin/videos', {
        layout: 'admin',
        user: req.session.user,
        users,
        videos,
        currentPage,
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos,
        query: { search, sort },
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
    }

    async createVideo(req, res) {
    try {
        const { youtubeId } = req.body;

        // Lấy thông tin từ YouTube API
        const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=snippet,contentDetails&key=${apiKey}`;
        const response = await axios.get(apiUrl);
        const item = response.data.items[0];

        if (!item) return res.status(404).json({ message: 'Không tìm thấy video trên YouTube' });

        const snippet = item.snippet;
        const contentDetails = item.contentDetails;

        const video = new Video({
        title: snippet.title,
        youtubeId,
        description: snippet.description,
        thumbnail: snippet.thumbnails?.medium?.url,
        category: 'YouTube',
        level: 'Trung bình',
        rating: 0,
        duration: parseDuration(contentDetails.duration),
        lessons: 1,
        students: 0,
        instructor: snippet.channelTitle,
        });

        await video.save();
        res.status(201).json({ message: 'Video đã được tạo', video });
    } catch (error) {
        console.error('Lỗi tạo video:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi khi tạo video' });
    }
    }

    async editVideo(req, res) {
    try {
        const { id } = req.params;
        const { youtubeId } = req.body;

        const updateData = { ...req.body };

        if (youtubeId) {
        const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCAsJisZhiEP6Haersjru30mcOnwZ3lLhs';
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=snippet,contentDetails&key=${apiKey}`;
        const response = await axios.get(apiUrl);
        const item = response.data.items[0];

        if (item) {
            updateData.title = item.snippet.title;
            updateData.description = item.snippet.description;
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
            res.sendStatus(200);
        } catch (err) {
            res.sendStatus(500);
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
}
module.exports = new VideoController();