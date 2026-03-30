using Core.DTOs.Auth;
using Core.DTOs.Common;

namespace Core.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string token, string refreshToken);
}
