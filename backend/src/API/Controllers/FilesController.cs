using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public FilesController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    // Upload file
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string folder = "images")
    {
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

        using var stream = file.OpenReadStream();
        var fileUrl = await _fileStorageService.UploadFileAsync(stream, file.FileName, folder);
        
        // Cloudinary tra ve full URL, khong can goi GetFileUrl
        // Neu la local storage, fileUrl la relative path, can tao full URL
        if (!fileUrl.StartsWith("http"))
        {
            fileUrl = _fileStorageService.GetFileUrl(Path.GetFileName(fileUrl), folder);
        }

        return Ok(new
        {
            success = true,
            message = "Upload thành công",
            data = new
            {
                filePath = fileUrl,
                fileUrl,
                fileName = file.FileName,
                fileSize = file.Length
            }
        });
    }

    // Lấy file
    [HttpGet("{*filePath}")]
    [AllowAnonymous]
    public IActionResult GetFile(string filePath)
    {
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        var fullPath = Path.Combine(uploadsFolder, filePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { success = false, message = "Không tìm thấy file" });
        }

        var fileBytes = System.IO.File.ReadAllBytes(fullPath);
        var contentType = GetContentType(filePath);

        return File(fileBytes, contentType);
    }

    // Xóa file
    [HttpDelete("{*filePath}")]
    public async Task<IActionResult> DeleteFile(string filePath)
    {
        var result = await _fileStorageService.DeleteFileAsync(filePath);
        if (!result)
        {
            return NotFound(new { success = false, message = "Không tìm thấy file" });
        }
        return Ok(new { success = true, message = "Đã xóa file" });
    }

    // Helper: Lấy content type
    private string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}
