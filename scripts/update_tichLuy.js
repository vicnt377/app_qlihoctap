// updateTichLuy.js
const mongoose = require('mongoose');
const Score = require('../models/Score'); // đổi path nếu cần
require('dotenv').config();

async function updateTichLuy() {
  try {
    await mongoose.connect('mongodb://localhost:27017/quanlitiendo');

    const result = await Score.updateMany(
      { tichLuy: { $exists: false } },  
      { $set: { tichLuy: true } }
    );

    console.log("Đã cập nhật:", result.modifiedCount, "bản ghi");
    process.exit();
  } catch (err) {
    console.error("Lỗi:", err);
    process.exit(1);
  }
}

updateTichLuy();
