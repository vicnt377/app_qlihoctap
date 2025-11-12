require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Video = require('../models/Video'); // chỉnh lại path nếu cần

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quanlitiendo';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Hàm parse ISO 8601 duration (VD: PT1H2M10S → "1 giờ 2 phút 10 giây")
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = duration.match(regex) || [];
  return `${hours ? `${hours} giờ ` : ''}${minutes ? `${minutes} phút ` : ''}${seconds ? `${seconds} giây` : ''}`.trim();
}

// Hàm gọi API YouTube
async function fetchDuration(youtubeId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${youtubeId}&key=${YOUTUBE_API_KEY}`;
    const response = await axios.get(url);

    if (!response.data.items.length) {
      console.warn(`❌ Không tìm thấy video: ${youtubeId}`);
      return null;
    }

    return response.data.items[0].contentDetails.duration;
  } catch (err) {
    console.error(`⚠️ Lỗi API cho video ${youtubeId}:`, err.message);
    return null;
  }
}

// Chạy update toàn bộ video
async function updateDurations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    const videos = await Video.find({});
    console.log(`🔍 Tìm thấy ${videos.length} video cần cập nhật`);
    const count = await Video.countDocuments();
    console.log(`📦 Tổng số video trong DB: ${count}`);

    const sample = await Video.findOne();
    console.log('Ví dụ 1 video:', sample);

    for (const video of videos) {
      if (video.duration) {
        console.log(`⏭ Bỏ qua video ${video.title} (đã có duration)`);
        continue;
      }

      console.log(`⏳ Đang xử lý video: ${video.title} (${video.youtubeId})`);

      const isoDuration = await fetchDuration(video.youtubeId);
      if (!isoDuration) continue;

      video.duration = parseDuration(isoDuration);
      await video.save();

      console.log(`✅ Đã cập nhật: ${video.title} → ${video.duration}`);
    }

    console.log("🎉 Hoàn thành cập nhật duration cho tất cả video");
    process.exit(0);

  } catch (err) {
    console.error("❌ Lỗi script:", err);
    process.exit(1);
  }
}

updateDurations();
