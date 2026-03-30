using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Thêm các dịch vụ vào container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Cấu hình DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Cấu hình Identity với thông báo lỗi tiếng Việt
builder.Services.AddIdentity<User, IdentityRole>(options =>
    {
        // Cấu hình mật khẩu
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false; // Tắt yêu cầu ký tự đặc biệt để dễ đăng ký hơn
        options.Password.RequiredLength = 6;
        
        // Cấu hình user
        options.User.RequireUniqueEmail = true;
        options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    })
    .AddErrorDescriber<VietnameseIdentityErrorDescriber>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Đăng ký các Repository
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Đăng ký các Service
builder.Services.AddScoped<IAuthService, AuthService>();

// Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Cấu hình JWT Authentication (chưa triển khai)
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(options => { ... });

// Cấu hình Identity
// builder.Services.AddIdentity<User, IdentityRole>()
//     .AddEntityFrameworkStores<ApplicationDbContext>()
//     .AddDefaultTokenProviders();

var app = builder.Build();

// Cấu hình HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowClient");

// app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Tạo database và seed dữ liệu mẫu
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    
    try
    {
        // Áp dụng migrations
        dbContext.Database.Migrate();
        
        // Seed dữ liệu mẫu
        await SeedData.SeedAsync(dbContext, userManager, roleManager);
        
        Console.WriteLine("✅ Database đã được tạo và seed dữ liệu thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Lỗi database: {ex.Message}");
    }
}

app.Run();
