require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quanlitiendo';

const videoSchema = new mongoose.Schema({
  title: String,
  category: String,
  daXoa: { type: Boolean, default: false },
});

const Video = mongoose.model('Video', videoSchema, 'videos');

async function countVideosByCategory() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công\n');
    console.log('Kết nối tới:', MONGO_URI);

    const results = await Video.aggregate([
      { $match: { daXoa: false } },
      { $group: { _id: '$category', totalVideos: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    if (results.length === 0) {
      console.log('\n⚠️ Không tìm thấy video nào trong cơ sở dữ liệu.');
    } else {
      console.log('\n📊 Số lượng video theo danh mục:\n');
      results.forEach((r) =>
        console.log(`📁 ${r._id || 'Không xác định'} — ${r.totalVideos} video`)
      );
    }
  } catch (err) {
    console.error('❌ Lỗi khi đếm video:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB.');
  }
}

countVideosByCategory();
