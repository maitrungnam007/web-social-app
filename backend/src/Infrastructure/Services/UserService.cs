using Core.DTOs.Auth;
using Core.DTOs.Common;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý logic người dùng
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<Core.Entities.User> _userManager;

    public UserService(ApplicationDbContext context, UserManager<Core.Entities.User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // Lấy thông tin người dùng theo ID
    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(string id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return ApiResponse<UserDto>.ErrorResult("Không tìm thấy người dùng");
        }

        var userDto = MapToDto(user);
        return ApiResponse<UserDto>.SuccessResult(userDto);
    }

    // Cập nhật hồ sơ người dùng
    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return ApiResponse<UserDto>.ErrorResult("Không tìm thấy người dùng");
        }

        // Cập nhật các trường nếu có giá trị
        if (dto.FirstName != null)
            user.FirstName = dto.FirstName;
        
        if (dto.LastName != null)
            user.LastName = dto.LastName;
        
        if (dto.Bio != null)
            user.Bio = dto.Bio;
        
        if (dto.AvatarUrl != null)
            user.AvatarUrl = dto.AvatarUrl;
        
        if (dto.CoverImageUrl != null)
            user.CoverImageUrl = dto.CoverImageUrl;

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var userDto = MapToDto(user);
        return ApiResponse<UserDto>.SuccessResult(userDto, "Cập nhật hồ sơ thành công");
    }

    // Tìm kiếm người dùng
    public async Task<ApiResponse<List<UserDto>>> SearchUsersAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return ApiResponse<List<UserDto>>.ErrorResult("Từ khóa tìm kiếm không được để trống");
        }

        var users = await _context.Users
            .Where(u => u.UserName!.Contains(searchTerm) || 
                        u.Email!.Contains(searchTerm) ||
                        (u.FirstName != null && u.FirstName.Contains(searchTerm)) ||
                        (u.LastName != null && u.LastName.Contains(searchTerm)))
            .Take(20)
            .ToListAsync();

        var userDtos = users.Select(MapToDto).ToList();
        return ApiResponse<List<UserDto>>.SuccessResult(userDtos);
    }

    // Đổi mật khẩu
    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");
        }

        // Kiểm tra mật khẩu hiện tại
        var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
        if (!isCurrentPasswordValid)
        {
            return ApiResponse<bool>.ErrorResult("Mật khẩu hiện tại không đúng");
        }

        // Đổi mật khẩu
        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.ErrorResult("Đổi mật khẩu thất bại", errors);
        }

        return ApiResponse<bool>.SuccessResult(true, "Đổi mật khẩu thành công");
    }

    // Helper: Map entity to DTO
    private UserDto MapToDto(Core.Entities.User user)
    {
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio
        };
    }
}
