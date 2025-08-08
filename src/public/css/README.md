# CSS Structure - Hệ Thống Quản Lý Tiến Độ Học Tập

## Tổng quan
Các file CSS đã được tách riêng từ các layout files để dễ quản lý và bảo trì.

## Cấu trúc file

### 1. `main.css`
- **Mục đích**: CSS chung cho layout chính (user interface)
- **Sử dụng trong**: `layouts/main.hbs`
- **Nội dung chính**:
  - Body styles và background
  - Navbar styles
  - Card components
  - Button styles
  - Form styles
  - Chat interface styles
  - Table styles
  - Alert và Modal styles
  - Progress bar styles
  - Dropdown styles

### 2. `admin.css`
- **Mục đích**: CSS riêng cho admin interface
- **Sử dụng trong**: `layouts/admin.hbs`
- **Nội dung chính**:
  - Admin sidebar styles
  - Toggle button styles
  - Content layout styles
  - Dashboard header styles
  - Footer styles

### 3. `auth.css`
- **Mục đích**: CSS riêng cho authentication pages
- **Sử dụng trong**: `layouts/auth.hbs`
- **Nội dung chính**:
  - Authentication container styles
  - Form styles cho login/register
  - Button styles
  - Link styles

## Cách sử dụng

### Trong layout files:
```html
<!-- Cho main layout -->
<link rel="stylesheet" href="/css/main.css" />

<!-- Cho admin layout -->
<link rel="stylesheet" href="/css/admin.css" />

<!-- Cho auth layout -->
<link rel="stylesheet" href="/css/auth.css" />
```

### Cấu hình Express:
Static file serving đã được cấu hình trong `src/index.js`:
```javascript
app.use('/css', express.static(path.join(__dirname, 'public/css')));
```

## Lợi ích của việc tách CSS

1. **Dễ bảo trì**: Mỗi layout có CSS riêng, dễ tìm và sửa
2. **Tái sử dụng**: CSS có thể được sử dụng lại cho các trang khác
3. **Hiệu suất**: Browser có thể cache CSS files riêng biệt
4. **Tổ chức code**: Code HTML sạch hơn, không có CSS inline
5. **Phát triển team**: Nhiều developer có thể làm việc trên các file CSS khác nhau

## Quy tắc đặt tên

- Sử dụng kebab-case cho class names
- Prefix rõ ràng cho các component (ví dụ: `.chat-`, `.admin-`, `.auth-`)
- Comment rõ ràng cho các section CSS
- Tổ chức CSS theo thứ tự: layout → components → utilities

## Cập nhật

Khi cần thêm styles mới:
1. Xác định layout cần thêm (main/admin/auth)
2. Thêm styles vào file CSS tương ứng
3. Đảm bảo không conflict với styles hiện có
4. Test trên các trang liên quan 