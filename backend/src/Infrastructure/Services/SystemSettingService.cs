using Core.DTOs;
using Core.DTOs.Common;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SystemSettingService : ISystemSettingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SystemSettingService> _logger;

    // Keys cho cac c?u hinh mac d?nh
    private const string KeyDefaultBanDays = "DefaultBanDays";
    private const string KeyNotifyOnViolation = "NotifyOnViolation";
    private const string KeyMaxPostsPerDay = "MaxPostsPerDay";
    private const string KeyMaxCommentsPerDay = "MaxCommentsPerDay";
    private const string KeyReportsToAutoHide = "ReportsToAutoHide";
    private const string KeyViolationsToAutoBan = "ViolationsToAutoBan";
    private const string KeyBlockBadWords = "BlockBadWords";

    public SystemSettingService(ApplicationDbContext context, ILogger<SystemSettingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Lay c?u hinh h? th?ng
    public async Task<ApiResponse<SystemConfigDto>> GetConfigAsync()
    {
        try
        {
            var settings = await _context.SystemSettings.ToDictionaryAsync(s => s.Key, s => s.Value);

            var config = new SystemConfigDto
            {
                DefaultBanDays = GetIntValue(settings, KeyDefaultBanDays, 7),
                NotifyOnViolation = GetBoolValue(settings, KeyNotifyOnViolation, true),
                MaxPostsPerDay = GetIntValue(settings, KeyMaxPostsPerDay, 50),
                MaxCommentsPerDay = GetIntValue(settings, KeyMaxCommentsPerDay, 200),
                ReportsToAutoHide = GetIntValue(settings, KeyReportsToAutoHide, 5),
                ViolationsToAutoBan = GetIntValue(settings, KeyViolationsToAutoBan, 3),
                BlockBadWords = GetBoolValue(settings, KeyBlockBadWords, true)
            };

            return ApiResponse<SystemConfigDto>.SuccessResult(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi l?y c?u hinh h? th?ng");
            return ApiResponse<SystemConfigDto>.ErrorResult("C l?i x?y ra khi l?y c?u hinh");
        }
    }

    // C?p nh?t c?u hinh
    public async Task<ApiResponse<SystemSettingDto>> UpdateSettingAsync(string key, string value)
    {
        try
        {
            var setting = await _context.SystemSettings.FindAsync(key);

            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = key,
                    Value = value,
                    Category = GetCategoryForKey(key),
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<SystemSettingDto>.SuccessResult(new SystemSettingDto
            {
                Key = setting.Key,
                Value = setting.Value,
                Description = setting.Description,
                Category = setting.Category
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi c?p nh?t c?u hinh {Key}", key);
            return ApiResponse<SystemSettingDto>.ErrorResult("C l?i x?y ra khi c?p nh?t c?u hinh");
        }
    }

    // Lay tat ca c?u hinh
    public async Task<ApiResponse<List<SystemSettingDto>>> GetAllSettingsAsync()
    {
        try
        {
            var settings = await _context.SystemSettings
                .OrderBy(s => s.Category)
                .ThenBy(s => s.Key)
                .Select(s => new SystemSettingDto
                {
                    Key = s.Key,
                    Value = s.Value,
                    Description = s.Description,
                    Category = s.Category
                })
                .ToListAsync();

            return ApiResponse<List<SystemSettingDto>>.SuccessResult(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi l?y danh sch c?u hinh");
            return ApiResponse<List<SystemSettingDto>>.ErrorResult("C l?i x?y ra khi l?y danh sch c?u hinh");
        }
    }

    // Lay danh sch t? kh?a c?m
    public async Task<ApiResponse<List<BadWordDto>>> GetBadWordsAsync(string? category = null)
    {
        try
        {
            var query = _context.BadWords.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(b => b.Category == category);
            }

            var badWords = await query
                .OrderBy(b => b.Category)
                .ThenBy(b => b.Word)
                .Select(b => new BadWordDto
                {
                    Id = b.Id,
                    Word = b.Word,
                    Category = b.Category,
                    IsActive = b.IsActive,
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync();

            return ApiResponse<List<BadWordDto>>.SuccessResult(badWords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi l?y danh sch t? kh?a c?m");
            return ApiResponse<List<BadWordDto>>.ErrorResult("C l?i x?y ra khi l?y danh sch t? kh?a c?m");
        }
    }

    // Thm t? kh?a c?m
    public async Task<ApiResponse<BadWordDto>> AddBadWordAsync(CreateBadWordDto dto)
    {
        try
        {
            // Ki?m tra d t?n t?i
            var existing = await _context.BadWords.FirstOrDefaultAsync(b => b.Word.ToLower() == dto.Word.ToLower());
            if (existing != null)
            {
                return ApiResponse<BadWordDto>.ErrorResult("T? kh?a d t?n t?i");
            }

            var badWord = new BadWord
            {
                Word = dto.Word.ToLower().Trim(),
                Category = dto.Category,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.BadWords.Add(badWord);
            await _context.SaveChangesAsync();

            return ApiResponse<BadWordDto>.SuccessResult(new BadWordDto
            {
                Id = badWord.Id,
                Word = badWord.Word,
                Category = badWord.Category,
                IsActive = badWord.IsActive,
                CreatedAt = badWord.CreatedAt
            }, "D thm t? kh?a c?m");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi thm t? kh?a c?m");
            return ApiResponse<BadWordDto>.ErrorResult("C l?i x?y ra khi thm t? kh?a c?m");
        }
    }

    // Xa t? kh?a c?m
    public async Task<ApiResponse<bool>> DeleteBadWordAsync(int id)
    {
        try
        {
            var badWord = await _context.BadWords.FindAsync(id);
            if (badWord == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy từ khóa");
            }

            _context.BadWords.Remove(badWord);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa từ khóa cấm");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa từ khóa cấm {Id}", id);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa từ khóa cấm");
        }
    }

    // B?t/t?t t? kh?a c?m
    public async Task<ApiResponse<bool>> ToggleBadWordAsync(int id)
    {
        try
        {
            var badWord = await _context.BadWords.FindAsync(id);
            if (badWord == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy từ khóa");
            }

            badWord.IsActive = !badWord.IsActive;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, badWord.IsActive ? "Đã kích hoạt từ khóa" : "Đã vô hiệu hóa từ khóa");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thay đổi trạng thái từ khóa {Id}", id);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi thay đổi trạng thái");
        }
    }

    // Ki?m tra n?i dung c ch?a t? kh?a c?m
    public async Task<bool> ContainsBadWordAsync(string content)
    {
        var badWords = await _context.BadWords
            .Where(b => b.IsActive)
            .Select(b => b.Word)
            .ToListAsync();

        var lowerContent = content.ToLower();
        return badWords.Any(word => lowerContent.Contains(word));
    }

    // Helper methods
    private int GetIntValue(Dictionary<string, string> settings, string key, int defaultValue)
    {
        if (settings.TryGetValue(key, out var value) && int.TryParse(value, out var result))
        {
            return result;
        }
        return defaultValue;
    }

    private bool GetBoolValue(Dictionary<string, string> settings, string key, bool defaultValue)
    {
        if (settings.TryGetValue(key, out var value) && bool.TryParse(value, out var result))
        {
            return result;
        }
        return defaultValue;
    }

    private string GetCategoryForKey(string key)
    {
        return key switch
        {
            KeyDefaultBanDays or KeyNotifyOnViolation => "General",
            KeyMaxPostsPerDay or KeyMaxCommentsPerDay => "Limits",
            KeyReportsToAutoHide or KeyViolationsToAutoBan or KeyBlockBadWords => "Moderation",
            _ => "General"
        };
    }
}
