# InteractHub - Ứng dụng Mạng xã hội

Ứng dụng mạng xã hội full-stack được xây dựng với ASP.NET Core 8.0 và React 18+.

## 🚀 Công nghệ sử dụng

### Backend
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core 8.0** với SQL Server
- **ASP.NET Core Identity** cho xác thực
- **JWT Bearer** token authentication
- **SignalR** cho thông báo thời gian thực

### Frontend
- **React 18+** với TypeScript
- **Vite** cho phát triển nhanh
- **Tailwind CSS** cho giao diện
- **React Router v6** cho điều hướng
- **React Hook Form** cho xử lý form
- **Axios** cho gọi API
- **SignalR client** cho tính năng thời gian thực

### Cloud & DevOps
- **Microsoft Azure** (App Service, SQL Database, Blob Storage)
- **CI/CD** với GitHub Actions

## 📁 Cấu trúc dự án

```
web-social-app/
├── backend/                      # Backend ASP.NET Core
│   ├── src/
│   │   ├── API/                  # Lớp Web API
│   │   │   ├── Controllers/      # Các Controller API
│   │   │   ├── Middleware/       # Middleware tùy chỉnh
│   │   │   └── Extensions/       # Phương thức mở rộng
│   │   ├── Core/                 # Lớp nghiệp vụ
│   │   │   ├── Entities/         # Các thực thể miền
│   │   │   ├── DTOs/             # Đối tượng truyền dữ liệu
│   │   │   ├── Interfaces/       # Giao diện Service/Repository
│   │   │   └── Enums/            # Các enumeration
│   │   └── Infrastructure/       # Lớp truy cập dữ liệu
│   │       ├── Data/             # DbContext, cấu hình
│   │       ├── Repositories/     # Triển khai Repository
│   │       └── Services/         # Triển khai Service
│   └── tests/
│       └── Tests/                # Unit tests (xUnit)
├── frontend/                     # Frontend React
│   └── client/
│       ├── src/
│       │   ├── components/       # Components tái sử dụng
│       │   ├── pages/            # Components trang
│       │   ├── layouts/          # Components bố cục
│       │   ├── contexts/         # React contexts
│       │   ├── hooks/            # Custom hooks
│       │   ├── services/         # Dịch vụ API
│       │   ├── types/            # TypeScript types
│       │   └── utils/            # Hàm tiện ích
│       └── public/               # Tài nguyên tĩnh
├── database/                     # Cơ sở dữ liệu
│   └── Migrations/               # EF Core migrations
└── README.md
```

## ✨ Tính năng

- Đăng ký và đăng nhập người dùng với JWT authentication
- Tạo, sửa, xóa bài đăng với hình ảnh
- Stories (nội dung tạm thời hết hạn sau 24 giờ)
- Thả tim và bình luận bài đăng
- Gửi và quản lý lời mời kết bạn
- Thông báo thời gian thực qua SignalR
- Quản lý hồ sơ người dùng
- Hashtag xu hướng
- Báo cáo nội dung và kiểm duyệt (Admin)

## 🛠️ Hướng dẫn cài đặt

### Yêu cầu
- .NET SDK 8.0
- Node.js 18+
- SQL Server (LocalDB hoặc bản đầy đủ)

### Cài đặt Backend

```bash
# Di chuyển đến thư mục dự án
cd web-social-app

# Khôi phục các gói phụ thuộc
dotnet restore

# Áp dụng migrations cho database
dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/API --context ApplicationDbContext

# Chạy API
dotnet run --project backend/src/API
```

### Cài đặt Frontend

```bash
# Di chuyển đến thư mục client
cd frontend/client

# Cài đặt các gói phụ thuộc
npm install

# Chạy server phát triển
npm run dev
```

## 📊 Cơ sở dữ liệu

Ứng dụng bao gồm các thực thể sau:
- **User** - Mở rộng IdentityUser với thông tin hồ sơ
- **Post** - Bài đăng người dùng với nội dung và hình ảnh
- **Comment** - Bình luận trên bài đăng với phản hồi lồng nhau
- **Like** - Lượt thích trên bài đăng và bình luận
- **Friendship** - Mối quan hệ bạn bè giữa người dùng
- **Story** - Nội dung tạm thời hết hạn sau 24 giờ
- **StoryView** - Theo dõi ai đã xem stories
- **Notification** - Thông báo người dùng
- **Hashtag** - Hashtag xu hướng
- **PostHashtag** - Quan hệ Many-to-Many
- **PostReport** - Báo cáo kiểm duyệt nội dung

## 🔌 Các API Endpoints

### Xác thực
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập người dùng
- `POST /api/auth/refresh-token` - Làm mới JWT token

### Bài đăng
- `GET /api/posts` - Lấy bài đăng có phân trang
- `GET /api/posts/{id}` - Lấy chi tiết bài đăng
- `POST /api/posts` - Tạo bài đăng mới
- `PUT /api/posts/{id}` - Cập nhật bài đăng
- `DELETE /api/posts/{id}` - Xóa bài đăng
- `POST /api/posts/{id}/like` - Thích bài đăng
- `DELETE /api/posts/{id}/like` - Bỏ thích bài đăng

### Bình luận
- `GET /api/comments/post/{postId}` - Lấy bình luận của bài đăng
- `POST /api/comments` - Tạo bình luận
- `PUT /api/comments/{id}` - Cập nhật bình luận
- `DELETE /api/comments/{id}` - Xóa bình luận

### Bạn bè
- `GET /api/friends` - Lấy danh sách bạn bè
- `GET /api/friends/requests` - Lấy lời mời kết bạn
- `POST /api/friends/request` - Gửi lời mời kết bạn
- `POST /api/friends/accept/{id}` - Chấp nhận lời mời
- `POST /api/friends/reject/{id}` - Từ chối lời mời

### Stories
- `GET /api/stories` - Lấy stories đang hoạt động
- `POST /api/stories` - Tạo story mới
- `DELETE /api/stories/{id}` - Xóa story

### Thông báo
- `GET /api/notifications` - Lấy thông báo
- `GET /api/notifications/unread-count` - Đếm thông báo chưa đọc
- `POST /api/notifications/{id}/read` - Đánh dấu đã đọc

## 🧪 Testing

```bash
# Chạy tất cả tests
dotnet test

# Chạy với coverage
dotnet test --collect:"XPlat Code Coverage"
```

## � Tài khoản Test

Dưới đây là các tài khoản được seed sẵn trong database để test:

| Username | Email | Password | Vai trò |
|----------|-------|----------|---------|
| `user1` | user1@test.com | `Password123!` | User |
| `user2` | user2@test.com | `Password123!` | User |
| `admin` | admin@test.com | `Admin123!` | Admin |

**Lưu ý:** Các tài khoản này chỉ dùng cho mục đích test. Vui lòng đổi mật khẩu khi deploy production.

## �📝 Giấy phép

Dự án này được tạo cho mục đích giáo dục như một phần của khóa học C# and .NET Development (Spring 2026).
