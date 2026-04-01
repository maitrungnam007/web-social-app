using Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

// Service xử lý lưu trữ file local
public class FileStorageService : IFileStorageService
{
    private readonly IConfiguration _configuration;
    private readonly string _uploadFolder;

    public FileStorageService(IConfiguration configuration)
    {
        _configuration = configuration;
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
        catch
        {
            return Task.FromResult(false);
        }
    }

    // Lấy URL đầy đủ của file
    public string GetFileUrl(string fileName, string folder)
    {
        var baseUrl = _configuration["FileStorage:BaseUrl"] ?? "";
        return $"{baseUrl}/{folder}/{fileName}";
    }
}
