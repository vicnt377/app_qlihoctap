const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔍 Kiểm tra kết nối Gmail
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Error:", error);
  } else {
    console.log("✅ SMTP Gmail ready!");
  }
});

async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"EduSystem Support" <${process.env.EMAIL_ADMIN}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendMail;
