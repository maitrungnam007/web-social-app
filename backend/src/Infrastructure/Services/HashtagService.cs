using Core.DTOs.Common;
using Core.DTOs.Hashtag;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý hashtag
public class HashtagService : IHashtagService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HashtagService> _logger;

    public HashtagService(ApplicationDbContext context, ILogger<HashtagService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Lấy trending hashtags (sắp xếp theo UsageCount trong 7 ngày qua)
    public async Task<ApiResponse<List<HashtagResponseDto>>> GetTrendingHashtagsAsync(int count = 10)
    {
        try
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            
            // Lấy hashtags được sử dụng trong bài viết 7 ngày qua
            var hashtags = await _context.PostHashtags
                .Where(ph => ph.Post.CreatedAt >= sevenDaysAgo && !ph.Post.IsDeleted)
                .GroupBy(ph => ph.HashtagId)
                .Select(g => new
                {
                    HashtagId = g.Key,
                    RecentCount = g.Count(),
                    Hashtag = g.First().Hashtag
                })
                .OrderByDescending(x => x.RecentCount)
                .Take(count)
                .ToListAsync();

            var result = hashtags.Select(x => new HashtagResponseDto
            {
                Id = x.Hashtag.Id,
                Name = x.Hashtag.Name,
                UsageCount = x.RecentCount, // Số lần sử dụng trong 7 ngày
                CreatedAt = x.Hashtag.CreatedAt
            }).ToList();

            return ApiResponse<List<HashtagResponseDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy trending hashtags");
            return ApiResponse<List<HashtagResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách hashtag");
        }
    }

    // Tìm kiếm hashtag theo tên
    public async Task<ApiResponse<List<HashtagResponseDto>>> SearchHashtagsAsync(string searchTerm)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return ApiResponse<List<HashtagResponseDto>>.SuccessResult(new List<HashtagResponseDto>());
            }

            // Đếm số bài viết thực tế cho mỗi hashtag, bỏ qua hashtag không có bài viết
            var hashtags = await _context.Hashtags
                .Where(h => h.Name.Contains(searchTerm.ToLower()) && h.PostHashtags.Any(ph => !ph.Post.IsDeleted))
                .Select(h => new
                {
                    h.Id,
                    h.Name,
                    h.CreatedAt,
                    ActualCount = h.PostHashtags.Count(ph => !ph.Post.IsDeleted)
                })
                .OrderByDescending(x => x.ActualCount)
                .Take(20)
                .ToListAsync();

            var result = hashtags.Select(x => new HashtagResponseDto
            {
                Id = x.Id,
                Name = x.Name,
                UsageCount = x.ActualCount,
                CreatedAt = x.CreatedAt
            }).ToList();

            return ApiResponse<List<HashtagResponseDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tìm kiếm hashtag với từ khóa {SearchTerm}", searchTerm);
            return ApiResponse<List<HashtagResponseDto>>.ErrorResult("Có lỗi xảy ra khi tìm kiếm hashtag");
        }
    }

    // Lấy hashtag theo tên
    public async Task<ApiResponse<HashtagResponseDto>> GetHashtagByNameAsync(string name)
    {
        try
        {
            var hashtag = await _context.Hashtags
                .FirstOrDefaultAsync(h => h.Name == name.ToLower());

            if (hashtag == null)
            {
                return ApiResponse<HashtagResponseDto>.ErrorResult("Không tìm thấy hashtag");
            }

            return ApiResponse<HashtagResponseDto>.SuccessResult(MapToDto(hashtag));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy hashtag {Name}", name);
            return ApiResponse<HashtagResponseDto>.ErrorResult("Có lỗi xảy ra khi lấy hashtag");
        }
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
