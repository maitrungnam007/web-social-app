using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xu ly upload file len Cloudinary
public class CloudinaryService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
    {
        _logger = logger;
        
        var cloudName = configuration["Cloudinary:CloudName"] 
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        var apiKey = configuration["Cloudinary:ApiKey"] 
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        var apiSecret = configuration["Cloudinary:ApiSecret"] 
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            throw new InvalidOperationException("Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        
        _logger.LogInformation("Cloudinary initialized with cloud: {CloudName}", cloudName);
    }

    // Upload file len Cloudinary va tra ve public URL
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder)
    {
        try
        {
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = folder,
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            // Xu ly rieng cho image
            var extension = Path.GetExtension(fileName).ToLower();
            if (new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" }.Contains(extension))
            {
                uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(fileName, fileStream),
                    Folder = folder,
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false,
                    Transformation = new Transformation().Quality("auto").FetchFormat("auto")
                };
            }

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Error}", uploadResult.Error.Message);
                throw new Exception($"Cloudinary upload failed: {uploadResult.Error.Message}");
            }

            _logger.LogInformation("File uploaded to Cloudinary: {PublicId}", uploadResult.PublicId);
            
            // Tra ve public URL
            return uploadResult.SecureUrl.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi upload file {FileName} len Cloudinary", fileName);
            throw;
        }
    }

    // Xoa file tu Cloudinary
    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            // Extract public_id from URL
            var uri = new Uri(fileUrl);
            var pathSegments = uri.AbsolutePath.Split('/');
            
            // Tim folder va filename
            // URL format: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
            var uploadIndex = Array.FindIndex(pathSegments, s => s == "upload");
            if (uploadIndex < 0 || uploadIndex + 2 >= pathSegments.Length)
            {
                _logger.LogWarning("Invalid Cloudinary URL format: {FileUrl}", fileUrl);
                return false;
            }

            // Bo qua version (v1234567890) va lay public_id
            var publicIdParts = pathSegments.Skip(uploadIndex + 2);
            
            // Bo extension
            var lastPart = publicIdParts.Last();
            var lastPartWithoutExtension = Path.GetFileNameWithoutExtension(lastPart);
            
            var publicId = string.Join("/", publicIdParts.Take(publicIdParts.Count() - 1)) + "/" + lastPartWithoutExtension;
            if (publicIdParts.Count() == 1)
            {
                publicId = lastPartWithoutExtension;
            }

            var deletionParams = new DeletionParams(publicId);
            var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

            if (deletionResult.Error != null)
            {
                _logger.LogError("Cloudinary delete error: {Error}", deletionResult.Error.Message);
                return false;
            }

            _logger.LogInformation("File deleted from Cloudinary: {PublicId}", publicId);
            return deletionResult.Result == "ok";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi xoa file {FileUrl} tu Cloudinary", fileUrl);
            return false;
        }
    }

    // Lay URL day du cua file (da la full URL tu Cloudinary)
    public string GetFileUrl(string fileName, string folder)
    {
        // Cloudinary tra ve full URL khi upload, nen method nay khong can thiet
        // Tra ve empty string de bao loi neu goi
        _logger.LogWarning("GetFileUrl called but Cloudinary returns full URL on upload");
        return "";
    }
}
