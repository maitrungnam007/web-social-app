using Core.DTOs.Auth;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize] // Tạm thời tắt để test
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IFileStorageService _fileStorageService;
    
    public UsersController(IUserService userService, IFileStorageService fileStorageService)
    {
        _userService = userService;
        _fileStorageService = fileStorageService;
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult> GetUser(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        // Tạm thời dùng userId từ seeded data để test
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _userService.UpdateProfileAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    // Upload avatar và tự động cập nhật profile
    [HttpPost("avatar")]
    public async Task<ActionResult> UploadAvatar(IFormFile file)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        
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

        return Ok(new
        {
            success = true,
            message = "Cập nhật avatar thành công",
            data = new
            {
                avatarUrl = filePath,
                fullUrl = fileUrl,
                user = updateResult.Data
            }
        });
    }
    
    [HttpGet("search")]
    public async Task<ActionResult> SearchUsers([FromQuery] string term)
    {
        var result = await _userService.SearchUsersAsync(term);
        return Ok(result);
    }
    
    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        // Tạm thời dùng userId từ seeded data để test
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _userService.ChangePasswordAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
