const mongoose = require('mongoose');
const Score = require('../models/Score');
const Course = require('../models/Course');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/quanlitiendo');

  const scores = await Score.find({ user: "686a2a05a1ba3f4c62d03fc9" })
    .populate("HocPhan")
    .lean();

  const courses = await Course.find({ user: "686a2a05a1ba3f4c62d03fc9" })
    .lean();

//   console.log("SCORES:\n", JSON.stringify(scores, null, 2));
  console.log("COURSES:\n", JSON.stringify(courses, null, 2));

  process.exit(0);
}

run();
