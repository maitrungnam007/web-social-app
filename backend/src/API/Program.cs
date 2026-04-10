using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Thêm các dịch vụ vào container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Convert enum to string instead of integer
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Cấu hình DbContext - Tự động phát hiện loại database từ connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Thu doc truc tiep tu environment variable
var envConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

// Su dung env variable neu co, neu khong thi dung config
var finalConnectionString = envConnectionString ?? connectionString;

// Convert PostgreSQL URI sang Npgsql connection string format
// URI: postgresql://user:pass@host:port/db
// Npgsql: Host=host;Port=port;Username=user;Password=pass;Database=db
if (!string.IsNullOrEmpty(finalConnectionString) && finalConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        var uri = new Uri(finalConnectionString);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";

        finalConnectionString = $"Host={host};Port={port};Username={username};Password={password};Database={database};SSL Mode=Require;Trust Server Certificate=true";
        Console.WriteLine($"DEBUG Converted Npgsql Connection String: Host={host};Port={port};Database={database};Username={username}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DEBUG Failed to convert URI: {ex.Message}");
    }
}

var isPostgres = !string.IsNullOrEmpty(finalConnectionString) && 
    (finalConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) || 
     finalConnectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase));

Console.WriteLine($"DEBUG Is Postgres: {isPostgres}");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (isPostgres)
    {
        options.UseNpgsql(finalConnectionString);
    }
    else
    {
        options.UseSqlServer(finalConnectionString);
    }
});

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
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFriendService, FriendService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ISystemSettingService, SystemSettingService>();

// Cấu hình SignalR
builder.Services.AddSignalR();

// Cau hinh CORS - Ho tro ca FRONTEND_URL va ALLOWED_ORIGINS
var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"] 
    ?? builder.Configuration["FRONTEND_URL"]
    ?? "http://localhost:3000,http://localhost:5173,https://web-social-app-ochre.vercel.app,https://web-social-app.vercel.app";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(allowedOrigins.Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Cấu hình JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "InteractHub",
        ValidAudience = jwtSettings["Audience"] ?? "InteractHubClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Cấu hình Identity
// builder.Services.AddIdentity<User, IdentityRole>()
//     .AddEntityFrameworkStores<ApplicationDbContext>()
//     .AddDefaultTokenProviders();

var app = builder.Build();

// Cấu hình HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI();

// Chỉ bật HTTPS redirection trong production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<Infrastructure.Hubs.NotificationHub>("/hubs/notifications");

// Tao database va seed du lieu mau
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    
    try
    {
        // PostgreSQL: Dung EnsureCreated (khong can migrations)
        // SQL Server: Dung Migrate (co migrations san)
        if (isPostgres)
        {
            Console.WriteLine("DEBUG Using EnsureCreated for PostgreSQL");
            dbContext.Database.EnsureCreated();
        }
        else
        {
            Console.WriteLine("DEBUG Using Migrate for SQL Server");
            dbContext.Database.Migrate();
        }
        
        // Seed du lieu mau
        await SeedData.SeedAsync(dbContext, userManager, roleManager);
        
        // Warmup EF Core - thuc hien query don gian de cache execution plan
        await dbContext.Users.AsNoTracking().OrderBy(u => u.Id).Take(1).ToListAsync();
        await dbContext.Posts.AsNoTracking().OrderBy(p => p.Id).Take(1).ToListAsync();
        
        Console.WriteLine("✅ Database đã được tạo và seed dữ liệu thành công!");
        Console.WriteLine("🔥 EF Core warmup completed!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Loi database: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

app.Run();
