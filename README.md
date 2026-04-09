# InteractHub - Ứng dụng Mạng xã hội

Ứng dụng mạng xã hội full-stack được xây dựng với ASP.NET Core 8.0 và React 18+.

**Môn học:** C# and .NET Development  
**Học kỳ:** Spring 2026  
**Hạn nộp:** 19/04/2026

---

## 🔧 Công nghệ sử dụng

### Backend
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core 8.0** với SQL Server
- **ASP.NET Core Identity** cho xác thực
- **JWT Bearer** token authentication
- **SignalR** cho thông báo thời gian thực
- **xUnit** & **Moq** cho unit testing

### Frontend
- **React 18+** với TypeScript
- **Vite** cho phát triển nhanh
- **Tailwind CSS** cho responsive design
- **React Router v6** cho routing
- **React Hook Form** cho form handling
- **Axios** cho API calls
- **react-hot-toast** cho thông báo
- **SignalR Client** cho real-time updates

### Cloud & DevOps
- **Microsoft Azure** (App Service, SQL Database, Blob Storage)
- **CI/CD** với GitHub Actions

---

## 🗂️ Kiến trúc hệ thống

### Sơ đồ tổng quan

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   React Client    |<--->|   ASP.NET API     |<--->|   SQL Server      |
|   (Frontend)      |     |   (Backend)       |     |   (Database)      |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        |                         |                         |
        v                         v                         v
+-------------------+     +-------------------+     +-------------------+
| - Tailwind CSS    |     | - JWT Auth        |     | - EF Core         |
| - React Router    |     | - SignalR         |     | - Identity        |
| - Axios           |     | - Middleware      |     | - Migrations      |
| - Context API     |     | - Controllers     |     | - Seed Data       |
+-------------------+     +-------------------+     +-------------------+
```

### Clean Architecture

```
+------------------------------------------------------------------+
|                        API Layer                                  |
|  +------------------------------------------------------------+  |
|  | Controllers                                                |  |
|  | - AuthController      - PostsController                    |  |
|  | - UsersController     - CommentsController                 |  |
|  | - FriendsController   - StoriesController                   |  |
|  | - ReportsController   - NotificationsController            |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                 |
                                 v
+------------------------------------------------------------------+
|                       Core Layer                                 |
|  +---------------------------+  +-----------------------------+  |
|  | Entities                  |  | Interfaces                  |  |
|  | - User                    |  | - IUserService              |  |
|  | - Post                    |  | - IPostService              |  |
|  | - Comment                 |  | - ICommentService           |  |
|  | - Like                    |  | - IFriendService            |  |
|  | - Friendship              |  | - IStoryService             |  |
|  | - Story                   |  | - INotificationService      |  |
|  | - Notification            |  | - IReportService            |  |
|  | - Hashtag                 |  | - IAuthService              |  |
|  | - Report                  |  | - IFileStorageService       |  |
|  +---------------------------+  +-----------------------------+  |
|                                                                  |
|  +---------------------------+  +-----------------------------+  |
|  | DTOs                      |  | Enums                       |  |
|  | - AuthDTOs                |  | - FriendshipStatus          |  |
|  | - PostDTOs                |  | - ReportStatus              |  |
|  | - UserDTOs                |  | - MediaType                 |  |
|  | - FriendDTOs              |  | - NotificationType          |  |
|  | - StoryDTOs               |  | - UserRole                  |  |
|  +---------------------------+  +-----------------------------+  |
+------------------------------------------------------------------+
                                 |
                                 v
+------------------------------------------------------------------+
|                   Infrastructure Layer                           |
|  +---------------------------+  +-----------------------------+  |
|  | Data                      |  | Services                    |  |
|  | - ApplicationDbContext    |  | - UserService               |  |
|  | - DbSeeder                |  | - PostService               |  |
|  | - Migrations              |  | - CommentService            |  |
|  +---------------------------+  | - FriendService             |  |
|                                 | - StoryService              |  |
|                                 | - NotificationService       |  |
|                                 | - ReportService             |  |
|                                 | - AuthService               |  |
|                                 | - FileStorageService        |  |
|                                 +-----------------------------+  |
+------------------------------------------------------------------+
```

### Real-time Communication (SignalR)

```
+------------------+                    +------------------+
|                  |   WebSocket/SSE    |                  |
|   React Client   |<------------------>|   SignalR Hub    |
|                  |                    | (NotificationHub)|
+------------------+                    +------------------+
                                              |
                                              v
                                        +------------------+
                                        |  Notifications   |
                                        |  - New likes     |
                                        |  - Comments      |
                                        |  - Friend reqs   |
                                        |  - Reports       |
                                        +------------------+
```

### Authentication Flow

```
1. Dang nhap:
+----------+     POST /api/auth/login     +----------+
|  Client  | ---------------------------> |   API    |
+----------+                                +----------+
     ^                                           |
     |                                           v
     |                                    +-------------+
     |  JWT Token + Refresh Token         |  Validate   |
     +------------------------------------|  Credentials|
                                          +-------------+
                                                 |
                                                 v
                                          +-------------+
                                          |  Generate   |
                                          |  JWT Token  |
                                          +-------------+

2. Truy cap API:
+----------+     GET /api/posts     +----------+
|  Client  | ----------------------> |   API    |
+----------+   Authorization: Bearer +----------+
     ^                                    |
     |                                    v
     |                             +-------------+
     |  Protected Data             |  Validate   |
     +-----------------------------|  JWT Token  |
                                   +-------------+
```

---

## 🗂️ Cấu trúc dự án

```
web-social-app/
├── backend/                          # Backend ASP.NET Core
│   ├── src/
│   │   ├── API/                      # Lớp Web API
│   │   │   ├── Controllers/          # API Controllers
│   │   │   ├── Middleware/           # Middleware tùy chỉnh
│   │   │   ├── Extensions/           # Phương thức mở rộng
│   │   │   └── Hubs/                 # SignalR Hubs
│   │   ├── Core/                     # Lớp nghiệp vụ
│   │   │   ├── Entities/             # Các thực thể miền
│   │   │   ├── DTOs/                 # Request/Response DTOs
│   │   │   ├── Interfaces/           # Giao diện Service
│   │   │   └── Enums/                # Các enumeration
│   │   └── Infrastructure/           # Lớp truy cập dữ liệu
│   │       ├── Data/                 # DbContext, SeedData
│   │       └── Services/             # Triển khai Service
│   └── tests/
│       └── Tests/                    # Unit tests
├── frontend/                         # Frontend React
│   └── client/
│       ├── src/
│       │   ├── components/           # React components
│       │   ├── pages/                # Các trang
│       │   ├── layouts/              # MainLayout, AuthLayout, AdminLayout
│       │   ├── contexts/             # AuthContext
│       │   ├── hooks/                # Custom hooks
│       │   ├── services/             # API services
│       │   ├── types/                # TypeScript interfaces
│       │   └── utils/                # Hàm tiện ích
│       └── public/                   # Tài nguyên tĩnh
├── database/                         # SQL Scripts
└── README.md
```

---

## ✨ Tính năng

### Người dùng
- Đăng ký và đăng nhập với JWT authentication (refresh token)
- Quản lý hồ sơ cá nhân (avatar, cover, bio)
- Tạo, sửa, xóa bài đăng với hình ảnh
- Thả tim và bình luận bài đăng
- Stories (nội dung tạm thời hết hạn sau 24 giờ)
- Story Highlights (lưu trữ stories yêu thích)
- Gửi và quản lý lời mời kết bạn
- Tìm kiếm người dùng với debouncing
- Thông báo thời gian thực qua SignalR
- Hashtag xu hướng
- Báo cáo nội dung vi phạm
- Ẩn bài viết không mong muốn

### Quản trị (Admin)
- Dashboard với thống kê hệ thống
- Quản lý người dùng (xem, cấm, bỏ cấm)
- Kiểm duyệt nội dung (xử lý báo cáo)
- Quản lý cài đặt hệ thống
- Quản lý từ khóa cấm (Bad Words)
- Theo dõi vi phạm người dùng
- Xóa/ẩn bài viết (Admin)
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

### Các thực thể (16 entities)

| Entity | Mô tả | Relationships |
|--------|-------|---------------|
| **User** | Mở rộng IdentityUser | One-to-Many với Post, Comment, Story |
| **Post** | Bài đăng người dùng | Many-to-Many với Hashtag |
| **Comment** | Bình luận trên bài đăng | Nested replies |
| **Like** | Lượt thích | Post hoặc Comment |
| **Friendship** | Mối quan hệ bạn bè | Self-referencing Many-to-Many |
| **Story** | Nội dung tạm thời (24h) | One-to-Many với StoryView |
| **StoryView** | Lượt xem story | Many-to-One với Story |
| **StoryHighlight** | Bộ sưu tập story | Many-to-Many với Story |
| **StoryHighlightItem** | Story trong highlight | Junction table |
| **Notification** | Thông báo người dùng | Many-to-One với User |
| **Hashtag** | Hashtag xu hướng | Many-to-Many với Post |
| **PostHashtag** | Post-Hashtag junction | Many-to-Many |
| **Report** | Báo cáo nội dung | Admin management |
| **HiddenPost** | Bài viết đã ẩn | User preferences |
| **SystemSetting** | Cấu hình hệ thống | Key-Value pairs |
| **BadWord** | Từ khóa cấm | Content moderation |

### Database Diagram

```
User ──1:N──> Post ──1:N──> Comment
  │            │              │
  │            └──1:N──> Like <──┘
  │
  ├──1:N──> Story ──1:N──> StoryView
  │             │
  │             └──N:N──> StoryHighlight
  │
  ├──N:N──> Friendship (self-referencing)
  │
  ├──1:N──> Notification
  │
  └──1:N──> Report (as Reporter)

Post ──N:N──> Hashtag
Post ──1:N──> Report
Post ──1:N──> HiddenPost

SystemSetting ──1:N──> BadWord
```

---

## 🔌 Các API Endpoints (50+)

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
| POST | `/api/posts/{id}/hide` | Ẩn bài đăng |
| DELETE | `/api/posts/{id}/hide` | Bỏ ẩn bài đăng |
| DELETE | `/api/posts/admin/{id}` | Admin xóa bài đăng |
| POST | `/api/posts/admin/{id}/hide` | Admin ẩn bài đăng |
| DELETE | `/api/posts/admin/{id}/hide` | Admin bỏ ẩn bài đăng |

### Bình luận (`CommentsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/comments/post/{postId}` | Lấy bình luận bài đăng |
| POST | `/api/comments` | Tạo bình luận |
| PUT | `/api/comments/{id}` | Cập nhật bình luận |
| DELETE | `/api/comments/{id}` | Xóa bình luận |
| POST | `/api/comments/{id}/like` | Thích bình luận |
| DELETE | `/api/comments/{id}/like` | Bỏ thích bình luận |

### Người dùng (`UsersController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users/search` | Tìm kiếm người dùng |
| GET | `/api/users/{id}` | Lấy thông tin người dùng |
| PUT | `/api/users/profile` | Cập nhật hồ sơ |
| POST | `/api/users/change-password` | Đổi mật khẩu |
| GET | `/api/users` | Lấy tất cả users (admin) |
| POST | `/api/users/{id}/ban` | Cấm người dùng (admin) |
| DELETE | `/api/users/{id}/ban` | Bỏ cấm người dùng (admin) |

### Bạn bè (`FriendsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/friends` | Lấy danh sách bạn bè |
| GET | `/api/friends/requests` | Lấy lời mời kết bạn |
| GET | `/api/friends/suggestions` | Gợi ý kết bạn |
| POST | `/api/friends/request` | Gửi lời mời kết bạn |
| POST | `/api/friends/accept/{id}` | Chấp nhận lời mời |
| POST | `/api/friends/reject/{id}` | Từ chối lời mời |
| DELETE | `/api/friends/{id}` | Hủy kết bạn |

### Stories (`StoriesController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stories` | Lấy stories đang hoạt động |
| GET | `/api/stories/archived` | Lấy stories đã lưu trữ |
| POST | `/api/stories` | Tạo story mới |
| DELETE | `/api/stories/{id}` | Xóa story |
| POST | `/api/stories/{id}/view` | Đánh dấu đã xem story |
| POST | `/api/stories/highlights` | Tạo highlight |
| GET | `/api/stories/highlights` | Lấy highlights |

### Thông báo (`NotificationsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/notifications` | Lấy thông báo |
| GET | `/api/notifications/unread-count` | Đếm thông báo chưa đọc |
| POST | `/api/notifications/{id}/read` | Đánh dấu đã đọc |
| POST | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |

### Hashtags (`HashtagsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/hashtags/trending` | Lấy hashtag xu hướng |
| GET | `/api/hashtags/search` | Tìm kiếm hashtag |
| GET | `/api/hashtags/{name}` | Lấy hashtag theo tên |

### Báo cáo (`ReportsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/reports` | Tạo báo cáo |
| GET | `/api/reports` | Lấy báo cáo (admin) |
| PUT | `/api/reports/{id}/resolve` | Xử lý báo cáo (admin) |
| GET | `/api/reports/user/{userId}` | Lấy báo cáo user (admin) |

### Cài đặt hệ thống (`SystemSettingsController`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/settings/config` | Lấy cấu hình hệ thống |
| GET | `/api/settings` | Lấy tất cả cài đặt |
| PUT | `/api/settings` | Cập nhật cài đặt |
| GET | `/api/settings/bad-words` | Lấy từ khóa cấm |
| POST | `/api/settings/bad-words` | Thêm từ khóa cấm |
| DELETE | `/api/settings/bad-words/{id}` | Xóa từ khóa cấm |

---

## 🧪 Testing

```bash
# Chạy tất cả unit tests
dotnet test

# Chạy với code coverage
dotnet test --collect:"XPlat Code Coverage"

# Chạy tests cho service cụ thể
dotnet test --filter "FullyQualifiedName~PostService"
```

### Test Coverage

| Service | Số tests |
|---------|----------|
| AuthServiceTests | 15 |
| CommentServiceTests | 18 |
| FriendServiceTests | 26 |
| HashtagServiceTests | 15 |
| PostServiceTests | 29 |
| ReportServiceTests | 17 |
| StoryServiceTests | 17 |
| UserServiceTests | 19 |
| **Total** | **157** |

- **Unit tests:** 157 test methods
- **Services tested:** 8 services
- **Admin tests:** 28 tests (Report, Post admin, User ban/unban)
- **Mock dependencies:** Moq cho ILogger, INotificationService, ISystemSettingService

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

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### Admin Moderation
![Admin Moderation](screenshots/admin-moderation.png)

---

## 🚀 Deployment

### Platform Overview

```
+------------------+     +------------------+     +------------------+
|   Vercel         |     |   Render         |     |   Render         |
|   (Frontend)     | --> |   (Backend API)  | --> |   (PostgreSQL)   |
|   FREE           |     |   FREE           |     |   FREE           |
+------------------+     +------------------+     +------------------+
```

### CI/CD Pipeline

```
+------------------+     +------------------+     +------------------+
|   Push to main   | --> |   GitHub Actions | --> |   Auto Deploy    |
+------------------+     +------------------+     +------------------+
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
            +-------------+         +-------------+
            | Backend CI  |         | Frontend CI |
            | - Build     |         | - Build     |
            | - Test      |         | - Lint      |
            | - Coverage  |         | - Artifact  |
            +-------------+         +-------------+
                    |                       |
                    v                       v
            +-------------+         +-------------+
            | Render Web  |         | Vercel      |
            | Service     |         | Static Site |
            +-------------+         +-------------+
```

### Workflow Files

| File | Trigger | Công việc |
|------|---------|-----------|
| `backend-ci.yml` | Push/PR to main | Build .NET, run tests, coverage |
| `frontend-ci.yml` | Push/PR to main | Build React, lint check |
| `deploy.yml` | Push to main | Trigger Render & Vercel deploy |

---

### 1. Deploy Backend len Render

**Buoc 1: Tao tai khoan Render**
- Truy cap [render.com](https://render.com) va dang ky (mien phi)

**Buoc 2: Tao PostgreSQL Database**
```
+ Dashboard > New > PostgreSQL
+ Name: interacthub-db
+ Database: interacthub
+ User: (tu dong)
+ Region: Singapore (gan Vietnam nhat)
+ Plan: Free
+ Create Database
```

**Buoc 3: Tao Web Service cho Backend**
```
+ Dashboard > New > Web Service
+ Connect GitHub repository
+ Name: interacthub-api
+ Region: Singapore
+ Branch: main
+ Root Directory: backend/src/API
+ Runtime: .NET 8
+ Build Command: dotnet publish -c Release -o ./publish
+ Start Command: ./publish/API
+ Plan: Free
```

**Buoc 4: Them Environment Variables**
```
+ ConnectionStrings__DefaultConnection = (Internal Database URL tu Render)
+ JWT_SECRET = (random string, co the generate)
+ ASPNETCORE_ENVIRONMENT = Production
+ FRONTEND_URL = https://your-app.vercel.app
```

**Buoc 5: Lay Deploy Hook URL**
```
+ Vao Web Service > Settings > Deploy Hook
+ Tao moi hook voi ten "github-actions"
+ Copy URL (can cho GitHub Actions)
```

---

### 2. Deploy Frontend len Vercel

**Buoc 1: Tao tai khoan Vercel**
- Truy cap [vercel.com](https://vercel.com) va dang ky bang GitHub (mien phi)

**Buoc 2: Import Project**
```
+ Vercel Dashboard > Add New > Project
+ Import Git Repository (chon project cua ban)
+ Framework Preset: Vite
+ Root Directory: frontend/client
+ Build Command: npm run build
+ Output Directory: dist
```

**Buoc 3: Them Environment Variables**
```
+ VITE_API_URL = https://interacthub-api.onrender.com
```

**Buoc 4: Lay Vercel Tokens**
```
+ Vercel Dashboard > Settings > Tokens
+ Tao token moi (can cho GitHub Actions)
+ Copy token
+ Vao Project Settings > General
+ Copy "Project ID" va "Org ID"
```

---

### 3. Cau hinh GitHub Secrets

Vao **GitHub Repository > Settings > Secrets and variables > Actions**

| Secret Name | Value | Lay tu |
|-------------|-------|--------|
| `RENDER_DEPLOY_HOOK_URL` | `https://api.render.com/deploy/...` | Render > Web Service > Settings > Deploy Hook |
| `VERCEL_TOKEN` | `xxxxxxxx` | Vercel > Settings > Tokens |
| `VERCEL_ORG_ID` | `team_xxxxxxxx` | Vercel > Project Settings > General |
| `VERCEL_PROJECT_ID` | `prj_xxxxxxxx` | Vercel > Project Settings > General |

---

### 4. Deploy tu dong

```bash
# Push code len GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# GitHub Actions se tu dong:
# 1. Build & Test backend
# 2. Build frontend
# 3. Trigger Render deploy hook
# 4. Deploy frontend to Vercel
```

---

### 5. URLs sau khi deploy

| Service | URL |
|---------|-----|
| Frontend | `https://your-app.vercel.app` |
| Backend API | `https://interacthub-api.onrender.com` |
| API Swagger | `https://interacthub-api.onrender.com/swagger` |

---

### Free Tier Limits

| Platform | Limit |
|----------|-------|
| **Render Web Service** | 750 hours/thang, spin down sau 15p inactivity |
| **Render PostgreSQL** | 1GB storage, 90 days trial (sau do can upgrade hoac dung Supabase) |
| **Vercel** | 100GB bandwidth/thang, unlimited builds |

**Luu y:** Render free tier se "sleep" sau 15 phut khong co request. Lan truy cap dau tien se mat 30-60 giay de "wake up".

---

## 📝 Giấy phép

Dự án này được tạo cho mục đích giáo dục như một phần của khóa học **C# and .NET Development (Spring 2026)**.
