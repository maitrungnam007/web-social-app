using Core.DTOs.Common;
using Core.DTOs.Story;
using Core.Entities;
using Core.Enums;
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
    private readonly INotificationService _notificationService;

    public StoryService(ApplicationDbContext context, ILogger<StoryService> logger, INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
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

    // Lấy danh sách stories đang hoạt động (chưa hết hạn) - chỉ của bạn bè
    public async Task<ApiResponse<List<StoryResponseDto>>> GetActiveStoriesAsync(string? currentUserId)
    {
        try
        {
            var now = DateTime.UtcNow;

            // Lấy danh sách bạn bè (accepted)
            var friendIds = await _context.Friendships
                .AsNoTracking()
                .Where(f => (f.RequesterId == currentUserId || f.AddresseeId == currentUserId) && f.Status == Core.Enums.FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            // Thêm chính mình vào danh sách để hiện story của mình
            if (currentUserId != null)
            {
                friendIds.Add(currentUserId);
            }

            var stories = await _context.Stories
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.ExpiresAt > now && friendIds.Contains(s.UserId))
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
            var story = await _context.Stories
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == storyId);
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

            // Lấy thông tin viewer
            var viewer = await _context.Users.FindAsync(viewerId);

            // Tạo view mới
            var storyView = new StoryView
            {
                StoryId = storyId,
                ViewerId = viewerId,
                ViewedAt = DateTime.UtcNow
            };

            _context.StoryViews.Add(storyView);
            await _context.SaveChangesAsync();

            // Tạo thông báo cho chủ story
            await _notificationService.CreateNotificationAsync(
                userId: story.UserId,
                type: NotificationType.StoryView,
                title: "Lượt xem story mới",
                message: $"{viewer?.UserName ?? "Ai đó"} đã xem story của bạn",
                relatedEntityId: viewerId, // userId của người xem story
                relatedEntityType: "User",
                actorId: viewerId
            );

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

    // Lấy danh sách story đã lưu trữ (Archive)
    public async Task<ApiResponse<List<ArchivedStoryResponseDto>>> GetArchivedStoriesAsync(string userId)
    {
        try
        {
            var archivedStories = await _context.Stories
                .AsNoTracking()
                .Include(s => s.StoryViews)
                .Where(s => s.UserId == userId && s.IsArchived && s.IsDeleted)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new ArchivedStoryResponseDto
                {
                    Id = s.Id,
                    Content = s.Content,
                    MediaUrl = s.MediaUrl,
                    MediaType = s.MediaType,
                    CreatedAt = s.CreatedAt,
                    ExpiresAt = s.ExpiresAt,
                    ViewCount = s.StoryViews.Count
                })
                .ToListAsync();

            return ApiResponse<List<ArchivedStoryResponseDto>>.SuccessResult(archivedStories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy story đã lưu trữ của user {UserId}", userId);
            return ApiResponse<List<ArchivedStoryResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy story đã lưu trữ");
        }
    }

    // Lấy danh sách highlights của user
    public async Task<ApiResponse<List<HighlightResponseDto>>> GetUserHighlightsAsync(string userId)
    {
        try
        {
            var highlights = await _context.StoryHighlights
                .AsNoTracking()
                .Include(h => h.Items)
                    .ThenInclude(i => i.Story)
                        .ThenInclude(s => s.User)
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new HighlightResponseDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    CoverImageUrl = h.CoverImageUrl,
                    StoryCount = h.Items.Count,
                    Stories = h.Items.OrderBy(i => i.Order).Select(i => new StoryResponseDto
                    {
                        Id = i.Story.Id,
                        Content = i.Story.Content,
                        MediaUrl = i.Story.MediaUrl,
                        MediaType = i.Story.MediaType,
                        UserId = i.Story.UserId,
                        UserName = i.Story.User != null ? i.Story.User.UserName : "",
                        UserAvatar = i.Story.User != null ? i.Story.User.AvatarUrl : null,
                        CreatedAt = i.Story.CreatedAt,
                        ExpiresAt = i.Story.ExpiresAt,
                        ViewCount = i.Story.StoryViews.Count,
                        IsViewedByCurrentUser = false
                    }).ToList(),
                    CreatedAt = h.CreatedAt
                })
                .ToListAsync();

            return ApiResponse<List<HighlightResponseDto>>.SuccessResult(highlights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy highlights của user {UserId}", userId);
            return ApiResponse<List<HighlightResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy highlights");
        }
    }

    // Tạo highlight mới
    public async Task<ApiResponse<HighlightResponseDto>> CreateHighlightAsync(CreateHighlightDto dto, string userId)
    {
        try
        {
            var highlight = new StoryHighlight
            {
                Name = dto.Name,
                CoverImageUrl = dto.CoverImageUrl,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.StoryHighlights.Add(highlight);
            await _context.SaveChangesAsync();

            // Thêm các story vào highlight
            if (dto.StoryIds.Any())
            {
                var order = 0;
                foreach (var storyId in dto.StoryIds)
                {
                    var story = await _context.Stories.FindAsync(storyId);
                    if (story != null && story.UserId == userId)
                    {
                        _context.StoryHighlightItems.Add(new StoryHighlightItem
                        {
                            HighlightId = highlight.Id,
                            StoryId = storyId,
                            Order = order++,
                            AddedAt = DateTime.UtcNow
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            return await GetUserHighlightsAsync(userId)
                .ContinueWith(t => {
                    var result = t.Result.Data?.FirstOrDefault(h => h.Id == highlight.Id);
                    return result != null
                        ? ApiResponse<HighlightResponseDto>.SuccessResult(result, "Tạo highlight thành công")
                        : ApiResponse<HighlightResponseDto>.ErrorResult("Không tìm thấy highlight vừa tạo");
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo highlight cho user {UserId}", userId);
            return ApiResponse<HighlightResponseDto>.ErrorResult("Có lỗi xảy ra khi tạo highlight");
        }
    }

    // Cập nhật highlight
    public async Task<ApiResponse<HighlightResponseDto>> UpdateHighlightAsync(int highlightId, UpdateHighlightDto dto, string userId)
    {
        try
        {
            var highlight = await _context.StoryHighlights.FindAsync(highlightId);
            if (highlight == null)
            {
                return ApiResponse<HighlightResponseDto>.ErrorResult("Không tìm thấy highlight");
            }

            if (highlight.UserId != userId)
            {
                return ApiResponse<HighlightResponseDto>.ErrorResult("Bạn không có quyền sửa highlight này");
            }

            highlight.Name = dto.Name;
            highlight.CoverImageUrl = dto.CoverImageUrl;
            await _context.SaveChangesAsync();

            var highlights = await GetUserHighlightsAsync(userId);
            var result = highlights.Data?.FirstOrDefault(h => h.Id == highlightId);
            return result != null
                ? ApiResponse<HighlightResponseDto>.SuccessResult(result, "Cập nhật highlight thành công")
                : ApiResponse<HighlightResponseDto>.ErrorResult("Không tìm thấy highlight");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật highlight {HighlightId}", highlightId);
            return ApiResponse<HighlightResponseDto>.ErrorResult("Có lỗi xảy ra khi cập nhật highlight");
        }
    }

    // Xóa highlight
    public async Task<ApiResponse<bool>> DeleteHighlightAsync(int highlightId, string userId)
    {
        try
        {
            var highlight = await _context.StoryHighlights.FindAsync(highlightId);
            if (highlight == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy highlight");
            }

            if (highlight.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền xóa highlight này");
            }

            _context.StoryHighlights.Remove(highlight);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa highlight");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa highlight {HighlightId}", highlightId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa highlight");
        }
    }

    // Thêm story vào highlight
    public async Task<ApiResponse<bool>> AddStoryToHighlightAsync(int highlightId, AddStoryToHighlightDto dto, string userId)
    {
        try
        {
            var highlight = await _context.StoryHighlights
                .Include(h => h.Items)
                .FirstOrDefaultAsync(h => h.Id == highlightId);

            if (highlight == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy highlight");
            }

            if (highlight.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền sửa highlight này");
            }

            var story = await _context.Stories.FindAsync(dto.StoryId);
            if (story == null || story.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Story không tồn tại hoặc không thuộc về bạn");
            }

            // Kiểm tra đã có trong highlight chưa
            if (highlight.Items.Any(i => i.StoryId == dto.StoryId))
            {
                return ApiResponse<bool>.ErrorResult("Story đã có trong highlight");
            }

            _context.StoryHighlightItems.Add(new StoryHighlightItem
            {
                HighlightId = highlightId,
                StoryId = dto.StoryId,
                Order = highlight.Items.Count,
                AddedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResult(true, "Đã thêm story vào highlight");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thêm story vào highlight {HighlightId}", highlightId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi thêm story vào highlight");
        }
    }

    // Xóa story khỏi highlight
    public async Task<ApiResponse<bool>> RemoveStoryFromHighlightAsync(int highlightId, int storyId, string userId)
    {
        try
        {
            var highlight = await _context.StoryHighlights.FindAsync(highlightId);
            if (highlight == null || highlight.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy highlight hoặc không có quyền");
            }

            var item = await _context.StoryHighlightItems
                .FirstOrDefaultAsync(i => i.HighlightId == highlightId && i.StoryId == storyId);

            if (item == null)
            {
                return ApiResponse<bool>.ErrorResult("Story không có trong highlight");
            }

            _context.StoryHighlightItems.Remove(item);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa story khỏi highlight");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa story khỏi highlight {HighlightId}", highlightId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa story khỏi highlight");
        }
    }
}
