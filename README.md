# InteractHub - Ứng dụng Mạng xã hội

Ứng dụng mạng xã hội full-stack được xây dựng với ASP.NET Core 8.0 và React 18+.

**Môn học:** C# and .NET Development  
**Học kỳ:** Spring 2026  
**Hạn nộp:** 19/04/2026

---

## 🚀 Công nghệ sử dụng

### Backend
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core 8.0** với SQL Server
- **ASP.NET Core Identity** cho xác thực
- **JWT Bearer** token authentication
- **SignalR** cho thông báo thời gian thực
- **xUnit** cho unit testing

### Frontend
- **React 18+** với TypeScript
- **Vite** cho phát triển nhanh
- **react-hot-toast** cho thông báo

### Cloud & DevOps
- **Microsoft Azure** (App Service, SQL Database, Blob Storage)
- **CI/CD** với GitHub Actions

---

## 📁 Cấu trúc dự án

```
web-social-app/
├── backend/                          # Backend ASP.NET Core
│   ├── src/
│   │   ├── API/                      # Lớp Web API
│   │   │   ├── Controllers/          # Các Controller API (6+)
│   │   │   ├── Middleware/           # Middleware tùy chỉnh
│   │   │   └── Extensions/           # Phương thức mở rộng
│   │   ├── Core/                     # Lớp nghiệp vụ
│   │   │   ├── Entities/             # 8+ thực thể miền
│   │   │   ├── DTOs/                 # Request/Response DTOs
│   │   │   ├── Interfaces/           # Giao diện Service/Repository
│   │   │   └── Enums/                # Các enumeration
│   │   └── Infrastructure/           # Lớp truy cập dữ liệu
│   │       ├── Data/                 # DbContext, SeedData
│   │       ├── Repositories/         # Triển khai Repository
│   │       ├── Services/             # Triển khai Service (5+)
│   │       └── Hubs/                 # SignalR Hubs
│   └── tests/
│       └── Tests/                    # Unit tests (xUnit)
├── frontend/                         # Frontend React
│   └── client/
│       ├── src/
│       │   ├── components/           # 16 React components
│       │   ├── pages/                # 7 trang chính
│       │   ├── layouts/              # MainLayout, AuthLayout
│       │   ├── contexts/             # AuthContext
│       │   ├── hooks/                # Custom hooks
│       │   ├── services/             # API services
│       │   ├── types/                # TypeScript interfaces
│       │   └── utils/                # Hàm tiện ích
│       └── public/                   # Tài nguyên tĩnh
└── README.md
```

---

## ✨ Tính năng

### Người dùng
- Đăng ký và đăng nhập với JWT authentication
- Quản lý hồ sơ cá nhân (avatar, cover, bio)
- Tạo, sửa, xóa bài đăng với hình ảnh
- Thả tim và bình luận bài đăng
- Stories (nội dung tạm thời hết hạn sau 24 giờ)
- Gửi và quản lý lời mời kết bạn
- Tìm kiếm người dùng với debouncing
- Thông báo thời gian thực qua SignalR
- Hashtag xu hướng

### Quản trị
- Báo cáo nội dung và kiểm duyệt
- Role-based authorization (User, Admin)

---

## 🛠️ Hướng dẫn cài đặt

### Yêu cầu
- **.NET SDK 8.0**
- **Node.js 18+**
- **SQL Server** (LocalDB hoặc bản đầy đủ)

### Cài đặt Backend

```bash
# Di chuyển đến thư mục dự án
cd web-social-app

# Khôi phục các gói phụ thuộc
dotnet restore

# Áp dụng migrations cho database
dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/API --context ApplicationDbContext

# Chạy API (mặc định: http://localhost:5259)
dotnet run --project backend/src/API
```

### Cài đặt Frontend

```bash
# Di chuyển đến thư mục client
cd frontend/client

# Cài đặt các gói phụ thuộc
npm install

# Chạy server phát triển (mặc định: http://localhost:5173)
npm run dev
```

---

## 📊 Cơ sở dữ liệu

### Các thực thể (8+ entities)

| Entity | Mô tả | Relationships |
|--------|-------|---------------|
| **User** | Mở rộng IdentityUser | One-to-Many với Post, Comment, Story |
| **Post** | Bài đăng người dùng | Many-to-Many với Hashtag |
| **Comment** | Bình luận trên bài đăng | Nested replies |
| **Like** | Lượt thích | Post hoặc Comment |
| **Friendship** | Mối quan hệ bạn bè | Self-referencing Many-to-Many |
| **Story** | Nội dung tạm thời (24h) | One-to-Many với StoryView |
| **Notification** | Thông báo người dùng | Many-to-One với User |
| **Hashtag** | Hashtag xu hướng | Many-to-Many với Post |
| **PostReport** | Báo cáo kiểm duyệt | Admin management |

### Database Diagram

```
User ──1:N──> Post ──1:N──> Comment
  │            │              │
  │            └──1:N──> Like <──┘
  │
  ├──1:N──> Story ──1:N──> StoryView
  │
  ├──N:N──> Friendship (self-referencing)
  │
  └──1:N──> Notification

Post ──N:N──> Hashtag
Post ──1:N──> PostReport
```

---

## 🔌 Các API Endpoints (20+)

### Xác thực (`AuthController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký người dùng mới |
| POST | `/api/auth/login` | Đăng nhập, trả về JWT token |
| POST | `/api/auth/refresh-token` | Làm mới JWT token |

### Bài đăng (`PostsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/posts` | Lấy bài đăng có phân trang |
| GET | `/api/posts/{id}` | Lấy chi tiết bài đăng |
| POST | `/api/posts` | Tạo bài đăng mới |
| PUT | `/api/posts/{id}` | Cập nhật bài đăng |
| DELETE | `/api/posts/{id}` | Xóa bài đăng |
| POST | `/api/posts/{id}/like` | Thích bài đăng |
| DELETE | `/api/posts/{id}/like` | Bỏ thích bài đăng |

### Người dùng (`UsersController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users/search` | Tìm kiếm người dùng |
| GET | `/api/users/{id}` | Lấy thông tin người dùng |
| PUT | `/api/users/profile` | Cập nhật hồ sơ |

### Bạn bè (`FriendsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/friends` | Lấy danh sách bạn bè |
| GET | `/api/friends/requests` | Lấy lời mời kết bạn |
| POST | `/api/friends/request` | Gửi lời mời kết bạn |
| POST | `/api/friends/accept/{id}` | Chấp nhận lời mời |
| POST | `/api/friends/reject/{id}` | Từ chối lời mời |

### Stories (`StoriesController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stories` | Lấy stories đang hoạt động |
| POST | `/api/stories` | Tạo story mới |
| DELETE | `/api/stories/{id}` | Xóa story |

### Thông báo (`NotificationsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/notifications` | Lấy thông báo |
| GET | `/api/notifications/unread-count` | Đếm thông báo chưa đọc |
| POST | `/api/notifications/{id}/read` | Đánh dấu đã đọc |

---

## 🧪 Testing

```bash
# Chạy tất cả unit tests
dotnet test

# Chạy với code coverage
dotnet test --collect:"XPlat Code Coverage"

# Chạy tests cho service cụ thể
dotnet test --filter "FullyQualifiedName~PostsService"
```

### Test Coverage
- **Unit tests:** 15+ test methods
- **Services tested:** PostsService, FriendsService, NotificationsService
- **Target coverage:** 60%+ cho services

---

## 🔑 Tài khoản Test

Dưới đây là các tài khoản được seed sẵn trong database:

| Username | Email | Password | Vai trò |
|----------|-------|----------|---------|
| `user1` | user1@example.com | `Password123!` | User |
| `user2` | user2@example.com | `Password123!` | User |
| `user3` | user3@example.com | `Password123!` | User |
| ... | ... | `Password123!` | User |
| `user20` | user20@example.com | `Password123!` | User |
| `admin` | admin@interacthub.com | `Admin123!` | Admin |

**Lưu ý:** 
- Có 20 user mẫu với password `Password123!`
- Admin account có thêm quyền quản lý báo cáo nội dung

---

## 📸 Screenshots

### Trang chủ
![Home Page](screenshots/home.png)

### Đăng nhập / Đăng ký
![Login](screenshots/login.png)
![Register](screenshots/register.png)

### Profile
![Profile](screenshots/profile.png)

### Stories
![Stories](screenshots/stories.png)

### Friends
![Friends](screenshots/friends.png)

### Notifications
![Notifications](screenshots/notifications.png)

---

## 🚀 Deployment

### Azure Resources
- **App Service:** [URL sẽ được cập nhật sau deploy]
- **SQL Database:** Azure SQL Database
- **Blob Storage:** Azure Blob Storage cho file uploads

### CI/CD Pipeline
- GitHub Actions workflow tự động deploy khi push lên `main` branch
- Environment variables được cấu hình trong Azure App Service

---

## 📝 Giấy phép

Dự án này được tạo cho mục đích giáo dục như một phần của khóa học **C# and .NET Development (Spring 2026)**.
