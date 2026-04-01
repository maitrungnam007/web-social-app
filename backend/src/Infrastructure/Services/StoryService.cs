using Core.DTOs.Common;
using Core.DTOs.Story;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý logic stories
public class StoryService : IStoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StoryService> _logger;

    public StoryService(ApplicationDbContext context, ILogger<StoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Tạo story mới
    public async Task<ApiResponse<StoryResponseDto>> CreateStoryAsync(CreateStoryDto dto, string userId)
    {
        try
        {
            // Kiểm tra nội dung hoặc media phải có
            if (string.IsNullOrWhiteSpace(dto.Content) && string.IsNullOrWhiteSpace(dto.MediaUrl))
            {
                return ApiResponse<StoryResponseDto>.ErrorResult("Story phải có nội dung hoặc hình ảnh/video");
            }

            var story = new Story
            {
                Content = dto.Content,
                MediaUrl = dto.MediaUrl,
                MediaType = dto.MediaType,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsDeleted = false
            };

            _context.Stories.Add(story);
            await _context.SaveChangesAsync();

            // Lấy thông tin user để trả về
            var user = await _context.Users.FindAsync(userId);
            
            var response = new StoryResponseDto
            {
                Id = story.Id,
                Content = story.Content,
                MediaUrl = story.MediaUrl,
                MediaType = story.MediaType,
                UserId = story.UserId,
                UserName = user?.UserName ?? "",
                UserAvatar = user?.AvatarUrl,
                CreatedAt = story.CreatedAt,
                ExpiresAt = story.ExpiresAt,
                ViewCount = 0,
                IsViewedByCurrentUser = false
            };

            return ApiResponse<StoryResponseDto>.SuccessResult(response, "Tạo story thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo story cho user {UserId}", userId);
            return ApiResponse<StoryResponseDto>.ErrorResult("Có lỗi xảy ra khi tạo story");
        }
    }

    // Xóa story
    public async Task<ApiResponse<bool>> DeleteStoryAsync(int storyId, string userId)
    {
        try
        {
            var story = await _context.Stories.FindAsync(storyId);
            if (story == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy story");
            }

            // Chỉ chủ sở hữu mới có thể xóa
            if (story.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền xóa story này");
            }

            story.IsDeleted = true;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa story");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa story {StoryId}", storyId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa story");
        }
    }

    // Lấy danh sách stories đang hoạt động (chưa hết hạn)
    public async Task<ApiResponse<List<StoryResponseDto>>> GetActiveStoriesAsync(string? currentUserId)
    {
        try
        {
            var now = DateTime.UtcNow;

            var stories = await _context.Stories
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.ExpiresAt > now)
                .Select(s => new StoryResponseDto
                {
                    Id = s.Id,
                    Content = s.Content,
                    MediaUrl = s.MediaUrl,
                    MediaType = s.MediaType,
                    UserId = s.UserId,
                    UserName = s.User != null ? s.User.UserName : "",
                    UserAvatar = s.User != null ? s.User.AvatarUrl : null,
                    CreatedAt = s.CreatedAt,
                    ExpiresAt = s.ExpiresAt,
                    ViewCount = s.StoryViews.Count,
                    IsViewedByCurrentUser = currentUserId != null && s.StoryViews.Any(sv => sv.ViewerId == currentUserId)
                })
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<StoryResponseDto>>.SuccessResult(stories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách stories đang hoạt động");
            return ApiResponse<List<StoryResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách stories");
        }
    }

    // Lấy stories của một user cụ thể
    public async Task<ApiResponse<List<StoryResponseDto>>> GetUserStoriesAsync(string userId, string? currentUserId)
    {
        try
        {
            var now = DateTime.UtcNow;

            var stories = await _context.Stories
                .AsNoTracking()
                .Where(s => s.UserId == userId && !s.IsDeleted && s.ExpiresAt > now)
                .Select(s => new StoryResponseDto
                {
                    Id = s.Id,
                    Content = s.Content,
                    MediaUrl = s.MediaUrl,
                    MediaType = s.MediaType,
                    UserId = s.UserId,
                    UserName = s.User != null ? s.User.UserName : "",
                    UserAvatar = s.User != null ? s.User.AvatarUrl : null,
                    CreatedAt = s.CreatedAt,
                    ExpiresAt = s.ExpiresAt,
                    ViewCount = s.StoryViews.Count,
                    IsViewedByCurrentUser = currentUserId != null && s.StoryViews.Any(sv => sv.ViewerId == currentUserId)
                })
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<StoryResponseDto>>.SuccessResult(stories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy stories của user {UserId}", userId);
            return ApiResponse<List<StoryResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách stories");
        }
    }

    // Đánh dấu đã xem story
    public async Task<ApiResponse<bool>> MarkStoryAsViewedAsync(int storyId, string viewerId)
    {
        try
        {
            var story = await _context.Stories.FindAsync(storyId);
            if (story == null || story.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy story");
            }

            // Không thể xem story của chính mình
            if (story.UserId == viewerId)
            {
                return ApiResponse<bool>.SuccessResult(true);
            }

            // Kiểm tra đã xem chưa
            var existingView = await _context.StoryViews
                .FirstOrDefaultAsync(sv => sv.StoryId == storyId && sv.ViewerId == viewerId);

            if (existingView != null)
            {
                return ApiResponse<bool>.SuccessResult(true, "Đã xem story này");
            }

            // Tạo view mới
            var storyView = new StoryView
            {
                StoryId = storyId,
                ViewerId = viewerId,
                ViewedAt = DateTime.UtcNow
            };

            _context.StoryViews.Add(storyView);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã đánh dấu xem story");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đánh dấu đã xem story {StoryId}", storyId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi đánh dấu đã xem story");
        }
    }

    // Helper: Map entity to DTO
    private StoryResponseDto MapToDto(Story story, string? currentUserId)
    {
        return new StoryResponseDto
        {
            Id = story.Id,
            Content = story.Content,
            MediaUrl = story.MediaUrl,
            MediaType = story.MediaType,
            UserId = story.UserId,
            UserName = story.User?.UserName ?? "",
            UserAvatar = story.User?.AvatarUrl,
            CreatedAt = story.CreatedAt,
            ExpiresAt = story.ExpiresAt,
            ViewCount = story.StoryViews?.Count ?? 0,
            IsViewedByCurrentUser = currentUserId != null && 
                story.StoryViews?.Any(sv => sv.ViewerId == currentUserId) == true
        };
    }
}
