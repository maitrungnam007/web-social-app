using Core.DTOs.Auth;
using Core.DTOs.Common;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
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

    public AuthService(UserManager<User> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    // Đăng ký người dùng mới
    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
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

        // Tạo token
        var token = GenerateJwtToken(user);
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
                    Bio = user.Bio
                }
            },
            "Đăng ký thành công"
        );
    }

    // Đăng nhập
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
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

        // Tạo token
        var token = GenerateJwtToken(user);
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
                    Bio = user.Bio
                }
            },
            "Đăng nhập thành công"
        );
    }

    // Làm mới token
    public Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string token, string refreshToken)
    {
        // TODO: Implement refresh token logic với database storage
        return Task.FromResult(ApiResponse<AuthResponseDto>.ErrorResult("Chức năng chưa được triển khai"));
    }

    // Tạo JWT token
    private string GenerateJwtToken(User user)
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
