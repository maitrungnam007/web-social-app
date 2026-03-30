using Core.DTOs.Auth;
using Core.DTOs.Common;

namespace Core.Interfaces;

public interface IUserService
{
    Task<ApiResponse<UserDto>> GetUserByIdAsync(string id);
    Task<ApiResponse<UserDto>> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task<ApiResponse<List<UserDto>>> SearchUsersAsync(string searchTerm);
}

public class UpdateProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverImageUrl { get; set; }
}
