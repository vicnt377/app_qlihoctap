# Hướng dẫn cho AI Coding Agent

## Tổng quan kiến trúc
- Ứng dụng Node.js tổ chức theo mô hình MVC: controllers, models, routes, views.
- Phân chia rõ ràng giữa chức năng quản trị (admin) và người dùng (user) qua các thư mục và route riêng biệt.
- Giao tiếp giữa các thành phần qua các route, controller, và model. Socket được sử dụng cho các chức năng realtime (xem `src/js/socket.js`).
- View sử dụng Handlebars (`.hbs`) với các layout và partials trong `src/resources/views/`.
- Static files (CSS, JS, images) phục vụ qua cấu hình trong `src/index.js`.

## Quy trình phát triển
- Khởi động server: `node src/index.js` hoặc dùng `nodemon` (cấu hình trong `nodemon.json`).
- Không có script test tự động, kiểm thử chủ yếu thủ công qua giao diện web và kiểm tra log.
- Debug: Sử dụng console.log hoặc debug trực tiếp trong các controller/model. Không có tích hợp debugger hoặc test coverage.

## Quy ước & mẫu code đặc thù
- Controllers chia theo vai trò (admin/user), mỗi chức năng là một file riêng (ví dụ: `controllers/admin/ChatController.js`).
- Models đặt trong `models/`, mỗi file là một collection MongoDB.
- Route chia theo vai trò, mỗi file route gắn với controller tương ứng.
- Middleware dùng cho xác thực, upload file, xử lý ảnh, cleanup notification, v.v. Đặt trong `middlewares/`.
- CSS tách riêng cho từng layout (`main.css`, `admin.css`, `auth.css`), xem `src/public/css/README.md`.
- Static file serving cấu hình trong `src/index.js`:
  ```js
  app.use('/css', express.static(path.join(__dirname, 'public/css')));
  ```

## Tích hợp & phụ thuộc
- Sử dụng MongoDB qua Mongoose (`util/mongoose.js`).
- Sử dụng Express cho routing và middleware.
- Sử dụng Handlebars cho view engine.
- Socket.io cho realtime chat.
- Không có CI/CD, không có test tự động.

## Ví dụ mẫu
- Thêm route mới cho admin:
  - Tạo file controller trong `controllers/admin/`
  - Tạo file route trong `routes/admin/`
  - Import và sử dụng controller trong route
- Thêm model mới:
  - Tạo file trong `models/`
  - Định nghĩa schema và export model

## Lưu ý đặc biệt
- Luôn kiểm tra phân quyền (admin/user) khi thêm chức năng mới.
- Đặt middleware xác thực ở đầu các route cần bảo vệ.
- Khi thêm static file, cập nhật cấu hình static serving nếu cần.

---
Đây là hướng dẫn dành cho AI agent để làm việc hiệu quả với codebase này. Nếu có phần nào chưa rõ hoặc thiếu, hãy phản hồi để bổ sung.