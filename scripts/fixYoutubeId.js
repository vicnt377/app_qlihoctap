require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Video = require('../models/Video'); // sửa đường dẫn nếu khác

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function checkYoutubeId(youtubeId) {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'id',
        id: youtubeId,
        key: YOUTUBE_API_KEY,
      },
    });
    return res.data.items.length > 0; // true nếu tồn tại
  } catch (err) {
    console.error('❌ Lỗi checkYoutubeId:', err.message);
    return false;
  }
}

async function searchYoutubeIdByTitle(title) {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: title,
        maxResults: 1,
        type: 'video',
        key: YOUTUBE_API_KEY,
      },
    });

    if (res.data.items.length > 0) {
      return res.data.items[0].id.videoId;
    }
    return null;
  } catch (err) {
    console.error('❌ Lỗi searchYoutubeIdByTitle:', err.message);
    return null;
  }
}

async function run() {
  await mongoose.connect('mongodb://localhost/quanlitiendo');
  console.log('✅ Đã kết nối MongoDB');

  const videos = await Video.find({});
  console.log(`🔍 Có ${videos.length} video cần kiểm tra`);

  for (const video of videos) {
    process.stdout.write(`⏳ Đang kiểm tra: ${video.title} (${video.youtubeId})... `);

    const valid = await checkYoutubeId(video.youtubeId);

    if (!valid) {
      console.log(`❌ Sai ID: ${video.youtubeId}`);
      const newId = await searchYoutubeIdByTitle(video.title);

      if (newId) {
        await Video.findByIdAndUpdate(video._id, { youtubeId: newId });
        console.log(`✅ Đã cập nhật ${video.title} → ${newId}`);
      } else {
        console.log(`⚠️ Không tìm thấy video phù hợp cho "${video.title}"`);
      }
    } else {
      console.log('✔️ OK');
    }
  }

  console.log('🎉 Hoàn thành kiểm tra và cập nhật youtubeId');
  mongoose.connection.close();
}

run();
