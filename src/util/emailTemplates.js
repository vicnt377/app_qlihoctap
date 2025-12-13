// 1️⃣ Email xác nhận đăng ký tài khoản
module.exports.registerSuccess = (username) => `
  <div style="font-family: Arial; color:#333;">
    <h2 style="color:#0056d2;">Chào mừng đến với EduSystem!</h2>

    <p>Xin chào <strong>${username}</strong>,</p>

    <p>Bạn đã đăng ký tài khoản thành công trên hệ thống EduSystem.</p>

    <p>Bạn có thể đăng nhập và bắt đầu sử dụng các chức năng học tập.</p>

    <p style="margin-top:20px; font-size:13px; color:#666;">
      EduSystem © 2025 – Hệ thống hỗ trợ quản lý tiến độ học tập cho sinh viên.
    </p>
  </div>
`;


// 2️⃣ Email thông báo đổi mật khẩu
module.exports.passwordChanged = (username) => `
  <div style="font-family: Arial; color:#333;">
    <h2 style="color:#0056d2;">EduSystem - Thông báo đổi mật khẩu</h2>

    <p>Xin chào <strong>${username}</strong>,</p>

    <p>Mật khẩu tài khoản của bạn vừa được thay đổi thành công.</p>

    <p>Nếu đây là bạn thực hiện, bạn có thể bỏ qua email này.</p>

    <p style="color:red; font-weight:bold;">
      Nếu KHÔNG PHẢI bạn, hãy đổi lại mật khẩu ngay lập tức để bảo vệ tài khoản!
    </p>

    <p style="margin-top:20px; font-size:13px; color:#666;">
      EduSystem © 2025 – Hệ thống hỗ trợ quản lý tiến độ học tập cho sinh viên.
    </p>
  </div>
`;


// 3️⃣ Email cảnh báo học vụ
module.exports.academicWarning = (username, details) => `
  <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">

    <p>Xin chào <strong>${username}</strong>,</p>

    <p>
      Hệ thống ghi nhận kết quả học tập của bạn
      <span style="color:#d9534f; font-weight:bold;">
        chưa đạt yêu cầu học vụ
      </span>:
    </p>

    <hr/>

    <div>
      ${details}
    </div>

    <p style="margin-top:10px;">
      Bạn vui lòng kiểm tra lại tiến độ học tập và có kế hoạch cải thiện kết quả học tập trong thời gian sớm nhất
      để tránh các hình thức xử lý học vụ tiếp theo.
    </p>

    <hr/>

    <p style="margin-top:20px; font-size:13px; color:#888;">
     EduSystem © 2025 – Hệ thống hỗ trợ quản lý tiến độ học tập cho sinh viên.
    </p>

  </div>
`;
