using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý lưu trữ file local
public class FileStorageService : IFileStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileStorageService> _logger;
    private readonly string _uploadFolder;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _uploadFolder = _configuration["FileStorage:UploadFolder"] ?? "uploads";
        
        // Tạo thư mục uploads nếu chưa tồn tại
        if (!Directory.Exists(_uploadFolder))
        {
            Directory.CreateDirectory(_uploadFolder);
        }
    }

    // Upload file và trả về đường dẫn tương đối
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder)
    {
        try
        {
            // Tạo thư mục con nếu cần
            var folderPath = Path.Combine(_uploadFolder, folder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // Tạo tên file unique
            var fileExtension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(folderPath, uniqueFileName);

            // Lưu file
            using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(fileStreamOutput);
            }

            // Trả về đường dẫn tương đối
            return Path.Combine(folder, uniqueFileName).Replace("\\", "/");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi upload file {FileName}", fileName);
            throw;
        }
    }

    // Xóa file
    public Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            var filePath = Path.Combine(_uploadFolder, fileUrl);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa file {FileUrl}", fileUrl);
            return Task.FromResult(false);
        }
    }

    // Lay URL day du cua file
    public string GetFileUrl(string fileName, string folder)
    {
        var baseUrl = _configuration["FileStorage:BaseUrl"];
        
        // Neu khong co BaseUrl, su dung URL mac dinh cho local development
        if (string.IsNullOrEmpty(baseUrl))
        {
            // Lay port tu configuration hoac dung port mac dinh
            var port = _configuration["Kestrel:Endpoints:Http:Url"] ?? "http://localhost:5259";
            baseUrl = port;
        }
        
        return $"{baseUrl}/uploads/{folder}/{fileName}";
    }
}
