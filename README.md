# 🌐 InteractHub - Mạng xã hội

Ứng dụng mạng xã hội full-stack được xây dựng với ASP.NET Core 8.0 và React 18+.

**Môn học:** C# and .NET Development | **Học kỳ:** Spring 2026 | **Hạn nộp:** 26/04/2026

---

## 🛠️ Công nghệ sử dụng

### Backend
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core 8.0** với SQL Server / PostgreSQL
- **JWT Bearer** token authentication
- **SignalR** cho thông báo thời gian thực
- **xUnit** & **Moq** cho unit testing
- **Cloudinary** cho cloud storage

### Frontend
- **React 18+** với TypeScript
- **Vite** cho phát triển nhanh
- **Tailwind CSS** cho responsive design
- **React Router v6** cho routing
- **React Hook Form** cho form handling
- **Axios** cho API calls
- **SignalR Client** cho real-time updates

### Cloud & DevOps
- **Render** (Backend API + PostgreSQL)
- **Vercel** (Frontend)
- **Cloudinary** (File storage)
- **GitHub Actions** (CI/CD)

---

## ✨ Tính năng

### Người dùng
- Đăng ký và đăng nhập với JWT authentication
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

### Quản trị (Admin)
- Dashboard với thống kê hệ thống
- Quản lý người dùng (xem, cấm, bỏ cấm)
- Kiểm duyệt nội dung (xử lý báo cáo)
- Quản lý cài đặt hệ thống
- Quản lý từ khóa cấm (Bad Words)
- Theo dõi vi phạm người dùng

---

## 📁 Cấu trúc dự án

```
web-social-app/
|-- backend/                           # Backend ASP.NET Core
|   |-- src/
|   |   |-- API/                       # Lớp Web API
|   |   |   |-- Controllers/           # 11 API Controllers
|   |   |   |-- Middleware/            # Middleware tùy chỉnh
|   |   |   |-- Extensions/            # Phương thức mở rộng
|   |   |   |-- Hubs/                  # SignalR Hubs
|   |   |
|   |   |-- Core/                      # Lớp nghiệp vụ
|   |   |   |-- Entities/              # 16 Entities
|   |   |   |-- DTOs/                  # Request/Response DTOs
|   |   |   |-- Interfaces/            # Giao diện Service
|   |   |   |-- Enums/                 # Các enumeration
|   |   |
|   |   |-- Infrastructure/            # Lớp truy cập dữ liệu
|   |       |-- Data/                  # DbContext, SeedData
|   |       |-- Services/              # Triển khai Service
|   |
|   |-- tests/
|       |-- Tests/                     # Unit tests (157 tests)
|           |-- Services/              # 8 Service Test Classes
|
|-- frontend/                          # Frontend React
|   |-- client/
|       |-- src/
|       |   |-- components/            # 24 React components
|       |   |-- pages/                 # 15 pages (9 user + 6 admin)
|       |   |-- layouts/               # MainLayout, AuthLayout, AdminLayout
|       |   |-- contexts/              # AuthContext
|       |   |-- hooks/                 # Custom hooks
|       |   |-- services/              # API services
|       |   |-- types/                 # TypeScript interfaces
|       |   |-- utils/                 # Hàm tiện ích
|       |
|       |-- public/                    # Tài nguyên tĩnh
|
|-- database/                          # SQL Scripts
|-- README.md                          # Tóm tắt dự án
```

---

## 🚀 Hướng dẫn cài đặt

### 📋 Yêu cầu
- 💻 **.NET SDK 8.0**
- 📦 **Node.js 18+**
- 🗄️ **SQL Server** hoặc **PostgreSQL**

### Backend

```bash
cd web-social-app
dotnet restore
dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/API
dotnet run --project backend/src/API
```

### Frontend

```bash
cd frontend/client
npm install
npm run dev
```

## 📊 Thống kê

| Thành phần | Số lượng |
|------------|----------|
| Entities | 16 |
| API Controllers | 11 |
| API Endpoints | 60+ |
| React Components | 24 |
| Pages (User + Admin) | 15 |
| Unit Tests | 157 |

---

## 🔌 API Endpoints

| Controller | Endpoints | Mô tả |
|------------|-----------|-------|
| AuthController | 3 | Đăng ký, đăng nhập, refresh token |
| PostsController | 12 | CRUD bài đăng, like, hide |
| CommentsController | 6 | CRUD bình luận, like |
| UsersController | 11 | Profile, avatar, cover, ban |
| FilesController | 3 | Upload, get, delete file |
| FriendsController | 7 | Kết bạn, chấp nhận, từ chối |
| StoriesController | 7 | CRUD story, highlights |
| NotificationsController | 4 | Thông báo, đánh dấu đã đọc |
| ReportsController | 4 | Báo cáo, xử lý (admin) |
| SystemSettingsController | 7 | Cài đặt hệ thống |

---

## 🔑 Tài khoản Test

| Username | Email | Password | Vai trò |
|----------|-------|----------|---------|
| user1 - user20 | user@example.com | `Password123!` | User |
| admin | admin@interacthub.com | `Admin123!` | Admin |

---

## 🧪 Testing

```bash
dotnet test                                    # Chạy tất cả tests
dotnet test --collect:"XPlat Code Coverage"   # Với coverage
```

**Test Coverage:** 157 tests cho 8 services (AuthService, PostService, UserService, etc.)

---

## 🌍 Deployment

### Platform

```
Vercel (Frontend) --> Render (Backend API) --> Render (PostgreSQL)
```

### CI/CD Pipeline

GitHub Actions tự động:
1. Build & Test backend
2. Build frontend
3. Deploy lên Render & Vercel

### URLs sau khi deploy

| Service | URL |
|---------|-----|
| Frontend | `https://web-social-app-ochre.vercel.app` |
| Backend API | `https://interacthub-api.onrender.com` |
| Swagger | `https://interacthub-api.onrender.com/swagger` |

---

## 📄 Giấy phép

Dự án được tạo cho mục đích giáo dục như một phần của khóa học **C# and .NET Development (Spring 2026)**.
