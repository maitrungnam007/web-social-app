using Core.DTOs.Common;
using Core.DTOs.Story;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý logic stories
public class StoryService : IStoryService
{
    private readonly ApplicationDbContext _context;

    public StoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Tạo story mới
    public async Task<ApiResponse<StoryResponseDto>> CreateStoryAsync(CreateStoryDto dto, string userId)
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

    // Xóa story
    public async Task<ApiResponse<bool>> DeleteStoryAsync(int storyId, string userId)
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

    // Lấy danh sách stories đang hoạt động (chưa hết hạn)
    public async Task<ApiResponse<List<StoryResponseDto>>> GetActiveStoriesAsync(string? currentUserId)
    {
        var now = DateTime.UtcNow;

        var stories = await _context.Stories
            .Include(s => s.User)
            .Include(s => s.StoryViews)
            .Where(s => !s.IsDeleted && s.ExpiresAt > now)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = stories.Select(s => MapToDto(s, currentUserId)).ToList();

        return ApiResponse<List<StoryResponseDto>>.SuccessResult(result);
    }

    // Lấy stories của một user cụ thể
    public async Task<ApiResponse<List<StoryResponseDto>>> GetUserStoriesAsync(string userId, string? currentUserId)
    {
        var now = DateTime.UtcNow;

        var stories = await _context.Stories
            .Include(s => s.User)
            .Include(s => s.StoryViews)
            .Where(s => s.UserId == userId && !s.IsDeleted && s.ExpiresAt > now)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = stories.Select(s => MapToDto(s, currentUserId)).ToList();

        return ApiResponse<List<StoryResponseDto>>.SuccessResult(result);
    }

    // Đánh dấu đã xem story
    public async Task<ApiResponse<bool>> MarkStoryAsViewedAsync(int storyId, string viewerId)
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
