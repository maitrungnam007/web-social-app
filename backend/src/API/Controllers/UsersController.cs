using Core.DTOs.Auth;
using Core.DTOs.Post;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Bật lại xác thực JWT
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IPostService _postService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, IFileStorageService fileStorageService, IPostService postService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _fileStorageService = fileStorageService;
        _postService = postService;
        _logger = logger;
    }
    
    // Lấy danh sách người dùng (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var result = await _userService.GetAllUsersAsync(page, pageSize, search);
        return Ok(result);
    }
    
    [HttpGet("{id}")]
    [AllowAnonymous] // Cho phép xem profile của user khác
    public async Task<ActionResult> GetUser(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        
        // Chặn user thông thường xem profile admin
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (result.Data?.Role == "Admin" && currentUserRole != "Admin")
        {
            return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
        }
        
        return Ok(result);
    }
    
    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _userService.UpdateProfileAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    // Upload avatar và tự động cập nhật profile
    [HttpPost("avatar")]
    public async Task<ActionResult> UploadAvatar(IFormFile file)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "Không có file được chọn" });
        }

        // Kiểm tra kích thước file (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { success = false, message = "File không được vượt quá 5MB" });
        }

        // Kiểm tra loại file
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });
        }

        // Upload file
        using var stream = file.OpenReadStream();
        var filePath = await _fileStorageService.UploadFileAsync(stream, file.FileName, "avatars");
        var fileUrl = _fileStorageService.GetFileUrl(Path.GetFileName(filePath), "avatars");

        // Cập nhật avatar cho user
        var updateResult = await _userService.UpdateProfileAsync(userId, new UpdateProfileDto
        {
            AvatarUrl = filePath
        });

        if (!updateResult.Success)
        {
            return BadRequest(updateResult);
        }

        // Tạo bài đăng tự động khi thay avatar
        var post = await _postService.CreatePostAsync(new CreatePostDto
        {
            Content = "đã thay đổi ảnh đại diện",
            ImageUrl = filePath
        }, userId);

        return Ok(new
        {
            success = true,
            message = "Cập nhật avatar thành công",
            data = new
            {
                avatarUrl = filePath,
                fullUrl = fileUrl,
                user = updateResult.Data,
                post = post.Success ? post.Data : null
            }
        });
    }
    
    // Xóa avatar và hiện lại avatar mặc định
    [HttpDelete("avatar")]
    public async Task<ActionResult> DeleteAvatar()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        try
        {
            // Lấy thông tin user để xóa file avatar cũ
            var userResult = await _userService.GetUserByIdAsync(userId);
            if (userResult.Success && userResult.Data?.AvatarUrl != null)
            {
                // Xóa file avatar cũ
                await _fileStorageService.DeleteFileAsync(userResult.Data.AvatarUrl);
            }
            
            // Cập nhật avatarUrl thành null
            var updateResult = await _userService.UpdateProfileAsync(userId, new UpdateProfileDto
            {
                AvatarUrl = "" // Empty string để set null
            });
            
            if (!updateResult.Success)
            {
                return BadRequest(updateResult);
            }
            
            return Ok(new
            {
                success = true,
                message = "Đã xóa avatar thành công",
                data = updateResult.Data
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
        }
    }
    
    // Upload ảnh bìa
    [HttpPost("cover")]
    public async Task<ActionResult> UploadCover(IFormFile file)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "Không có file được chọn" });
        }

        // Kiểm tra kích thước file (max 10MB cho cover)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { success = false, message = "File không được vượt quá 10MB" });
        }

        // Kiểm tra loại file
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });
        }

        // Upload file
        using var stream = file.OpenReadStream();
        var filePath = await _fileStorageService.UploadFileAsync(stream, file.FileName, "covers");
        var fileUrl = _fileStorageService.GetFileUrl(Path.GetFileName(filePath), "covers");

        // Cập nhật cover cho user
        var updateResult = await _userService.UpdateProfileAsync(userId, new UpdateProfileDto
        {
            CoverImageUrl = filePath
        });

        if (!updateResult.Success)
        {
            return BadRequest(updateResult);
        }

        // Tạo bài đăng tự động khi thay ảnh bìa
        var post = await _postService.CreatePostAsync(new CreatePostDto
        {
            Content = "đã thay đổi ảnh bìa",
            ImageUrl = filePath
        }, userId);

        return Ok(new
        {
            success = true,
            message = "Cập nhật ảnh bìa thành công",
            data = new
            {
                coverUrl = filePath,
                fullUrl = fileUrl,
                user = updateResult.Data,
                post = post.Success ? post.Data : null
            }
        });
    }
    
    // Xóa ảnh bìa
    [HttpDelete("cover")]
    public async Task<ActionResult> DeleteCover()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        try
        {
            // Lấy thông tin user để xóa file cover cũ
            var userResult = await _userService.GetUserByIdAsync(userId);
            if (userResult.Success && userResult.Data?.CoverImageUrl != null)
            {
                // Xóa file cover cũ
                await _fileStorageService.DeleteFileAsync(userResult.Data.CoverImageUrl);
            }
            
            // Cập nhật coverUrl thành null
            var updateResult = await _userService.UpdateProfileAsync(userId, new UpdateProfileDto
            {
                CoverImageUrl = "" // Empty string để set null
            });
            
            if (!updateResult.Success)
            {
                return BadRequest(updateResult);
            }
            
            return Ok(new
            {
                success = true,
                message = "Đã xóa ảnh bìa thành công",
                data = updateResult.Data
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi server: " + ex.Message });
        }
    }
    
    [HttpGet("search")]
    [AllowAnonymous] // Cho phép tìm kiếm user
    public async Task<ActionResult> SearchUsers([FromQuery] string term)
    {
        var result = await _userService.SearchUsersAsync(term);
        return Ok(result);
    }
    
    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _userService.ChangePasswordAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Admin: Ban user
    [HttpPost("{id}/ban")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> BanUser(string id, [FromBody] BanUserDto dto)
    {
        var result = await _userService.BanUserAsync(id, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Admin: Unban user
    [HttpDelete("{id}/ban")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UnbanUser(string id)
    {
        var result = await _userService.UnbanUserAsync(id);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
