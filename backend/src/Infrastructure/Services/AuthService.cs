using Core.DTOs.Auth;
using Core.DTOs.Common;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infrastructure.Services;

// Service xử lý xác thực người dùng
public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(UserManager<User> userManager, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    // Đăng ký người dùng mới
    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        try
        {
            // Kiểm tra username đã tồn tại
            var existingUser = await _userManager.FindByNameAsync(dto.UserName);
            if (existingUser != null)
            {
                return ApiResponse<AuthResponseDto>.ErrorResult("Tên đăng nhập đã tồn tại");
            }

            // Kiểm tra email đã tồn tại
            var existingEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingEmail != null)
            {
                return ApiResponse<AuthResponseDto>.ErrorResult("Email đã được sử dụng");
            }

            // Tạo user mới
            var user = new User
            {
                UserName = dto.UserName,
                Email = dto.Email,
                FirstName = dto.FirstName ?? "",
                LastName = dto.LastName ?? "",
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return ApiResponse<AuthResponseDto>.ErrorResult("Đăng ký thất bại", errors);
            }

            // Gán role User
            await _userManager.AddToRoleAsync(user, "User");
            var roles = await _userManager.GetRolesAsync(user);

            // Tạo token
            var token = GenerateJwtToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            // Trả về kết quả
            return ApiResponse<AuthResponseDto>.SuccessResult(
                new AuthResponseDto
                {
                    Success = true,
                    Message = "Đăng ký thành công",
                    Token = token,
                    RefreshToken = refreshToken,
                    User = new UserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName ?? "",
                        Email = user.Email ?? "",
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        AvatarUrl = user.AvatarUrl,
                        Bio = user.Bio,
                        Role = roles.FirstOrDefault()
                    }
                },
                "Đăng ký thành công"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đăng ký người dùng {UserName}", dto.UserName);
            return ApiResponse<AuthResponseDto>.ErrorResult("Có lỗi xảy ra khi đăng ký");
        }
    }

    // Đăng nhập
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        try
        {
            // Tìm user theo username
            var user = await _userManager.FindByNameAsync(dto.UserName);
            if (user == null)
            {
                return ApiResponse<AuthResponseDto>.ErrorResult("Tên đăng nhập hoặc mật khẩu không đúng");
            }

            // Kiểm tra mật khẩu
            var result = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!result)
            {
                return ApiResponse<AuthResponseDto>.ErrorResult("Tên đăng nhập hoặc mật khẩu không đúng");
            }

            // Lấy role của user
            var roles = await _userManager.GetRolesAsync(user);

            // Tạo token
            var token = GenerateJwtToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            return ApiResponse<AuthResponseDto>.SuccessResult(
                new AuthResponseDto
                {
                    Success = true,
                    Message = "Đăng nhập thành công",
                    Token = token,
                    RefreshToken = refreshToken,
                    User = new UserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName ?? "",
                        Email = user.Email ?? "",
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        AvatarUrl = user.AvatarUrl,
                        Bio = user.Bio,
                        Role = roles.FirstOrDefault()
                    }
                },
                "Đăng nhập thành công"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đăng nhập với username {UserName}", dto.UserName);
            return ApiResponse<AuthResponseDto>.ErrorResult("Có lỗi xảy ra khi đăng nhập");
        }
    }

    // Làm mới token
    public Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string token, string refreshToken)
    {
        try
        {
            // TODO: Implement refresh token logic với database storage
            return Task.FromResult(ApiResponse<AuthResponseDto>.ErrorResult("Chức năng chưa được triển khai"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi làm mới token");
            return Task.FromResult(ApiResponse<AuthResponseDto>.ErrorResult("Có lỗi xảy ra khi làm mới token"));
        }
    }

    // Tạo JWT token
    private string GenerateJwtToken(User user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
        var issuer = jwtSettings["Issuer"] ?? "InteractHub";
        var audience = jwtSettings["Audience"] ?? "InteractHubClient";
        var expirationInMinutes = int.Parse(jwtSettings["ExpirationInMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? ""),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Thêm role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Tạo refresh token
    private string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString("N");
    }
}
