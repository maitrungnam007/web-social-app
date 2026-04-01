using Core.DTOs.Common;
using Core.DTOs.Hashtag;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý hashtag
public class HashtagService : IHashtagService
{
    private readonly ApplicationDbContext _context;

    public HashtagService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Lấy trending hashtags (sắp xếp theo UsageCount)
    public async Task<ApiResponse<List<HashtagResponseDto>>> GetTrendingHashtagsAsync(int count = 10)
    {
        var hashtags = await _context.Hashtags
            .OrderByDescending(h => h.UsageCount)
            .ThenByDescending(h => h.CreatedAt)
            .Take(count)
            .ToListAsync();

        var result = hashtags.Select(MapToDto).ToList();

        return ApiResponse<List<HashtagResponseDto>>.SuccessResult(result);
    }

    // Tìm kiếm hashtag theo tên
    public async Task<ApiResponse<List<HashtagResponseDto>>> SearchHashtagsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return ApiResponse<List<HashtagResponseDto>>.SuccessResult(new List<HashtagResponseDto>());
        }

        var hashtags = await _context.Hashtags
            .Where(h => h.Name.Contains(searchTerm.ToLower()))
            .OrderByDescending(h => h.UsageCount)
            .Take(20)
            .ToListAsync();

        var result = hashtags.Select(MapToDto).ToList();

        return ApiResponse<List<HashtagResponseDto>>.SuccessResult(result);
    }

    // Lấy hashtag theo tên
    public async Task<ApiResponse<HashtagResponseDto>> GetHashtagByNameAsync(string name)
    {
        var hashtag = await _context.Hashtags
            .FirstOrDefaultAsync(h => h.Name == name.ToLower());

        if (hashtag == null)
        {
            return ApiResponse<HashtagResponseDto>.ErrorResult("Không tìm thấy hashtag");
        }

        return ApiResponse<HashtagResponseDto>.SuccessResult(MapToDto(hashtag));
    }

    // Helper: Map entity to DTO
    private HashtagResponseDto MapToDto(Hashtag hashtag)
    {
        return new HashtagResponseDto
        {
            Id = hashtag.Id,
            Name = hashtag.Name,
            UsageCount = hashtag.UsageCount,
            CreatedAt = hashtag.CreatedAt
        };
    }
}
