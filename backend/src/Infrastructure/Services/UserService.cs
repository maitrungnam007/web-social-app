using Core.DTOs.Auth;
using Core.DTOs.Common;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý logic người dùng
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<Core.Entities.User> _userManager;
    private readonly ILogger<UserService> _logger;

    public UserService(ApplicationDbContext context, UserManager<Core.Entities.User> userManager, ILogger<UserService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    // Lấy thông tin người dùng theo ID
    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(string id)
    {
        try
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResult("Không tìm thấy người dùng");
            }

            // Đếm số bạn bè
            var friendsCount = await _context.Friendships
                .AsNoTracking()
                .CountAsync(f => (f.RequesterId == id || f.AddresseeId == id) && 
                                f.Status == Core.Enums.FriendshipStatus.Accepted);

            var userDto = MapToDto(user, friendsCount);
            return ApiResponse<UserDto>.SuccessResult(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy thông tin người dùng {UserId}", id);
            return ApiResponse<UserDto>.ErrorResult("Có lỗi xảy ra khi lấy thông tin người dùng");
        }
    }

    // Cập nhật hồ sơ người dùng
    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        try
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
            
            // Empty string = xóa avatar (set null)
            if (dto.AvatarUrl == "")
                user.AvatarUrl = null;
            else if (dto.AvatarUrl != null)
                user.AvatarUrl = dto.AvatarUrl;
            
            if (dto.CoverImageUrl != null)
                user.CoverImageUrl = dto.CoverImageUrl;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var userDto = MapToDto(user);
            return ApiResponse<UserDto>.SuccessResult(userDto, "Cập nhật hồ sơ thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật hồ sơ người dùng {UserId}", userId);
            return ApiResponse<UserDto>.ErrorResult("Có lỗi xảy ra khi cập nhật hồ sơ");
        }
    }

    // Tìm kiếm người dùng
    public async Task<ApiResponse<List<UserDto>>> SearchUsersAsync(string searchTerm)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return ApiResponse<List<UserDto>>.ErrorResult("Từ khóa tìm kiếm không được để trống");
            }

            var users = await _context.Users
                .Where(u => !u.IsBanned && 
                            (u.UserName!.Contains(searchTerm) || 
                            u.Email!.Contains(searchTerm) ||
                            (u.FirstName != null && u.FirstName.Contains(searchTerm)) ||
                            (u.LastName != null && u.LastName.Contains(searchTerm))))
                .OrderBy(u => u.UserName)
                .Take(20)
                .ToListAsync();

            var userDtos = users.Select(MapToDto).ToList();
            return ApiResponse<List<UserDto>>.SuccessResult(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tìm kiếm người dùng với từ khóa {SearchTerm}", searchTerm);
            return ApiResponse<List<UserDto>>.ErrorResult("Có lỗi xảy ra khi tìm kiếm người dùng");
        }
    }

    // Đổi mật khẩu
    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đổi mật khẩu cho người dùng {UserId}", userId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi đổi mật khẩu");
        }
    }

    // Lấy danh sách người dùng (Admin)
    public async Task<ApiResponse<PagedResult<UserDto>>> GetAllUsersAsync(int page, int pageSize, string? search)
    {
        try
        {
            var query = _context.Users.AsQueryable();

            // Tìm kiếm theo username, email, họ tên
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(u => 
                    u.UserName!.Contains(search) || 
                    u.Email!.Contains(search) ||
                    (u.FirstName != null && u.FirstName.Contains(search)) ||
                    (u.LastName != null && u.LastName.Contains(search)));
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Lấy roles cho từng user
            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    AvatarUrl = user.AvatarUrl,
                    CoverImageUrl = user.CoverImageUrl,
                    Bio = user.Bio,
                    FriendsCount = 0,
                    Role = roles.FirstOrDefault(),
                    IsBanned = user.IsBanned,
                    BanReason = user.BanReason,
                    ViolationCount = user.ViolationCount
                });
            }

            var pagedResult = new PagedResult<UserDto>
            {
                Items = userDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return ApiResponse<PagedResult<UserDto>>.SuccessResult(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách người dùng");
            return ApiResponse<PagedResult<UserDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách người dùng");
        }
    }

    // Admin: Ban user
    public async Task<ApiResponse<bool>> BanUserAsync(string userId, string reason)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");

            user.IsBanned = true;
            user.BanReason = reason;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã cấm người dùng");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cấm người dùng {UserId}", userId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi cấm người dùng");
        }
    }

    // Admin: Unban user
    public async Task<ApiResponse<bool>> UnbanUserAsync(string userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");

            user.IsBanned = false;
            user.BanReason = null;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã gỡ cấm người dùng");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gỡ cấm người dùng {UserId}", userId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi gỡ cấm người dùng");
        }
    }

    // Helper: Map entity to DTO
    private UserDto MapToDto(Core.Entities.User user, int friendsCount = 0)
    {
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            CoverImageUrl = user.CoverImageUrl,
            Bio = user.Bio,
            FriendsCount = friendsCount,
            IsBanned = user.IsBanned,
            BanReason = user.BanReason,
            ViolationCount = user.ViolationCount
        };
    }
}
