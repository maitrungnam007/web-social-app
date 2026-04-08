using Core.DTOs;
using Core.DTOs.Common;
using Core.Entities;

namespace Core.Interfaces;

public interface ISystemSettingService
{
    // System Settings
    Task<ApiResponse<SystemConfigDto>> GetConfigAsync();
    Task<ApiResponse<SystemSettingDto>> UpdateSettingAsync(string key, string value);
    Task<ApiResponse<List<SystemSettingDto>>> GetAllSettingsAsync();

    // Bad Words
    Task<ApiResponse<List<BadWordDto>>> GetBadWordsAsync(string? category = null);
    Task<ApiResponse<BadWordDto>> AddBadWordAsync(CreateBadWordDto dto);
    Task<ApiResponse<bool>> DeleteBadWordAsync(int id);
    Task<ApiResponse<bool>> ToggleBadWordAsync(int id);
    Task<bool> ContainsBadWordAsync(string content);
}
