using Core.DTOs.Common;
using Core.DTOs.Post;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý logic bài đăng
public class PostService : IPostService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PostService> _logger;
    private readonly INotificationService _notificationService;
    private readonly ISystemSettingService _systemSettingService;

    public PostService(ApplicationDbContext context, ILogger<PostService> logger, INotificationService notificationService, ISystemSettingService systemSettingService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
        _systemSettingService = systemSettingService;
    }

    // Tạo bài đăng mới
    public async Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostDto dto, string userId)
    {
        try
        {
            // Kiểm tra giới hạn số bài viết mỗi ngày
            var config = await _systemSettingService.GetConfigAsync();
            if (config.Success && config.Data != null)
            {
                var today = DateTime.UtcNow.Date;
                var postsToday = await _context.Posts
                    .CountAsync(p => p.UserId == userId && p.CreatedAt.Date == today);
                
                if (postsToday >= config.Data.MaxPostsPerDay)
                {
                    return ApiResponse<PostResponseDto>.ErrorResult($"Bạn đã đạt giới hạn {config.Data.MaxPostsPerDay} bài viết/ngày.");
                }
            }

            // Kiểm tra từ khóa cấm
            var blockBadWords = await _systemSettingService.GetConfigAsync();
            if (blockBadWords.Success && blockBadWords.Data!.BlockBadWords)
            {
                var containsBadWord = await _systemSettingService.ContainsBadWordAsync(dto.Content ?? "");
                if (containsBadWord)
                {
                    return ApiResponse<PostResponseDto>.ErrorResult("Bài viết chứa từ khóa cấm. Vui lòng chỉnh sửa nội dung.");
                }
            }

            var post = new Post
            {
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Xử lý hashtags
            if (dto.Hashtags != null && dto.Hashtags.Any())
            {
                await ProcessHashtags(post.Id, dto.Hashtags);
            }

            // Xử lý mentions (@username)
            await ProcessMentions(post.Id, dto.Content, userId, "Post");

            return await GetPostByIdAsync(post.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo bài đăng cho user {UserId}", userId);
            return ApiResponse<PostResponseDto>.ErrorResult("Có lỗi xảy ra khi tạo bài đăng");
        }
    }

    // Cập nhật bài đăng
    public async Task<ApiResponse<PostResponseDto>> UpdatePostAsync(int postId, UpdatePostDto dto, string userId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<PostResponseDto>.ErrorResult("Không tìm thấy bài đăng");
            }

            if (post.UserId != userId)
            {
                return ApiResponse<PostResponseDto>.ErrorResult("Bạn không có quyền chỉnh sửa bài đăng này");
            }

            // Kiểm tra từ khóa cấm
            var config = await _systemSettingService.GetConfigAsync();
            if (config.Success && config.Data!.BlockBadWords)
            {
                var containsBadWord = await _systemSettingService.ContainsBadWordAsync(dto.Content ?? "");
                if (containsBadWord)
                {
                    return ApiResponse<PostResponseDto>.ErrorResult("Bài viết chứa từ khóa cấm. Vui lòng chỉnh sửa nội dung.");
                }
            }

            post.Content = dto.Content;
            post.ImageUrl = dto.ImageUrl;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetPostByIdAsync(postId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật bài đăng {PostId}", postId);
            return ApiResponse<PostResponseDto>.ErrorResult("Có lỗi xảy ra khi cập nhật bài đăng");
        }
    }

    // Xóa bài đăng
    public async Task<ApiResponse<bool>> DeletePostAsync(int postId, string userId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
            }

            if (post.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền xóa bài đăng này");
            }

            post.IsDeleted = true;
            post.UpdatedAt = DateTime.UtcNow;

            // Xoa tat ca binh luan cua bai viet
            var comments = await _context.Comments.Where(c => c.PostId == postId && !c.IsDeleted).ToListAsync();
            foreach (var comment in comments)
            {
                comment.IsDeleted = true;
                comment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa bài đăng thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa bài đăng {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa bài đăng");
        }
    }

    // Admin xóa bài đăng (không cần kiểm tra chủ sở hữu)
    public async Task<ApiResponse<bool>> AdminDeletePostAsync(int postId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
            }

            post.IsDeleted = true;
            post.UpdatedAt = DateTime.UtcNow;

            // Xoa tat ca binh luan cua bai viet
            var comments = await _context.Comments.Where(c => c.PostId == postId && !c.IsDeleted).ToListAsync();
            foreach (var comment in comments)
            {
                comment.IsDeleted = true;
                comment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa bài đăng thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi admin xóa bài đăng {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa bài đăng");
        }
    }

    // Lấy bài đăng theo ID
    public async Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(int postId, string? currentUserId)
    {
        try
        {
            // Dùng projection để tránh N+1 và in-memory counting
            var post = await _context.Posts
                .AsNoTracking()
                .Where(p => p.Id == postId && !p.IsDeleted)
                .Select(p => new PostResponseDto
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    UserId = p.UserId,
                    UserName = p.User != null ? p.User.UserName : "",
                    UserFirstName = p.User != null ? p.User.FirstName : null,
                    UserLastName = p.User != null ? p.User.LastName : null,
                    UserAvatar = p.User != null ? p.User.AvatarUrl : null,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    LikeCount = p.Likes.Count(l => l.CommentId == null && !l.User.IsBanned && l.User != null),
                    CommentCount = p.Comments.Count(c => !c.IsDeleted && !c.User.IsBanned && c.User != null),
                    IsLikedByCurrentUser = currentUserId != null && p.Likes.Any(l => l.UserId == currentUserId && l.CommentId == null),
                    IsHidden = p.IsHidden,
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag != null ? ph.Hashtag.Name : "").Where(n => !string.IsNullOrEmpty(n)).ToList()
                })
                .FirstOrDefaultAsync();

            if (post == null)
            {
                return ApiResponse<PostResponseDto>.ErrorResult("Không tìm thấy bài đăng");
            }

            return ApiResponse<PostResponseDto>.SuccessResult(post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy bài đăng {PostId}", postId);
            return ApiResponse<PostResponseDto>.ErrorResult("Có lỗi xảy ra khi lấy bài đăng");
        }
    }

    // Lấy danh sách bài đăng có phân trang
    public async Task<ApiResponse<PagedResult<PostResponseDto>>> GetPostsAsync(PostFilterDto filter, string? currentUserId)
    {
        try
        {
            var query = _context.Posts
                .AsNoTracking()
                .Where(p => !p.IsDeleted && !p.User.IsBanned);

            // Lọc theo userId
            if (!string.IsNullOrEmpty(filter.UserId))
            {
                query = query.Where(p => p.UserId == filter.UserId);
            }

            // Lọc theo hashtag
            if (!string.IsNullOrEmpty(filter.Hashtag))
            {
                query = query.Where(p => p.PostHashtags.Any(ph => ph.Hashtag.Name == filter.Hashtag));
            }

            // Tìm kiếm theo nội dung
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                query = query.Where(p => p.Content.Contains(filter.SearchTerm));
            }

            // Đếm tổng số trước phân trang
            var totalCount = await query.CountAsync();

            // Dùng projection để tránh N+1
            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(p => new PostResponseDto
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    UserId = p.UserId,
                    UserName = p.User != null ? p.User.UserName : "",
                    UserFirstName = p.User != null ? p.User.FirstName : null,
                    UserLastName = p.User != null ? p.User.LastName : null,
                    UserAvatar = p.User != null ? p.User.AvatarUrl : null,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    LikeCount = p.Likes.Count(l => l.CommentId == null && !l.User.IsBanned),
                    CommentCount = p.Comments.Count(c => !c.IsDeleted && !c.User.IsBanned),
                    IsLikedByCurrentUser = currentUserId != null && p.Likes.Any(l => l.UserId == currentUserId && l.CommentId == null),
                    IsHidden = p.IsHidden,
                    Hashtags = p.PostHashtags.Select(ph => ph.Hashtag != null ? ph.Hashtag.Name : "").Where(n => !string.IsNullOrEmpty(n)).ToList()
                })
                .ToListAsync();

            var result = new PagedResult<PostResponseDto>
            {
                Items = posts,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };

            return ApiResponse<PagedResult<PostResponseDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bài đăng");
            return ApiResponse<PagedResult<PostResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách bài đăng");
        }
    }

    // Thích bài đăng
    public async Task<ApiResponse<bool>> LikePostAsync(int postId, string userId)
    {
        try
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == postId);
                
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
            }

            // Kiểm tra đã thích chưa
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

            if (existingLike != null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn đã thích bài đăng này rồi");
            }

            // Lấy thông tin user like
            var liker = await _context.Users.FindAsync(userId);

            var like = new Like
            {
                PostId = postId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Likes.Add(like);
            await _context.SaveChangesAsync();

            // Tạo thông báo cho chủ bài viết (không thông báo khi tự like bài mình)
            if (post.UserId != userId)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: post.UserId,
                    type: NotificationType.Like,
                    title: "Lượt thích mới",
                    message: $"{liker?.UserName ?? "Ai đó"} đã thích bài viết của bạn",
                    relatedEntityId: postId.ToString(),
                    relatedEntityType: "Post",
                    actorId: userId
                );
            }

            return ApiResponse<bool>.SuccessResult(true, "Đã thích bài đăng");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thích bài đăng {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi thích bài đăng");
        }
    }

    // Bỏ thích bài đăng
    public async Task<ApiResponse<bool>> UnlikePostAsync(int postId, string userId)
    {
        try
        {
            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

            if (like == null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn chưa thích bài đăng này");
            }

            _context.Likes.Remove(like);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã bỏ thích bài đăng");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi bỏ thích bài đăng {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi bỏ thích bài đăng");
        }
    }

    // Xử lý hashtags
    private async Task ProcessHashtags(int postId, List<string> hashtags)
    {
        foreach (var tag in hashtags.Distinct())
        {
            var hashtag = await _context.Hashtags
                .FirstOrDefaultAsync(h => h.Name == tag.ToLower());

            if (hashtag == null)
            {
                hashtag = new Hashtag
                {
                    Name = tag.ToLower(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Hashtags.Add(hashtag);
                await _context.SaveChangesAsync();
            }

            var postHashtag = new PostHashtag
            {
                PostId = postId,
                HashtagId = hashtag.Id
            };

            _context.PostHashtags.Add(postHashtag);
        }

        await _context.SaveChangesAsync();
    }

    // Xử lý mentions (@username) trong content
    private async Task ProcessMentions(int postId, string content, string authorId, string entityType)
    {
        try
        {
            // Tìm tất cả @username trong content
            var mentionPattern = @"@(\w+)";
            var matches = System.Text.RegularExpressions.Regex.Matches(content, mentionPattern);
            
            if (matches.Count == 0) return;

            // Lấy thông tin author
            var author = await _context.Users.FindAsync(authorId);

            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                var username = match.Groups[1].Value;
                
                // Tìm user được mention
                var mentionedUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserName.ToLower() == username.ToLower());

                if (mentionedUser != null && mentionedUser.Id != authorId)
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: mentionedUser.Id,
                        type: NotificationType.Mention,
                        title: "Bạn được nhắc đến",
                        message: $"{author?.UserName ?? "Ai đó"} đã nhắc đến bạn trong bài viết",
                        relatedEntityId: postId.ToString(),
                        relatedEntityType: entityType,
                        actorId: authorId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý mentions cho bài đăng {PostId}", postId);
        }
    }

    // Ẩn bài viết cho user
    public async Task<ApiResponse<bool>> HidePostAsync(int postId, string userId)
    {
        try
        {
            // Kiểm tra bài viết tồn tại
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Không tìm thấy bài viết"
                };
            }

            // Kiểm tra đã ẩn chưa
            var existing = await _context.HiddenPosts
                .FirstOrDefaultAsync(h => h.UserId == userId && h.PostId == postId);
            
            if (existing != null)
            {
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Bài viết đã được ẩn trước đó",
                    Data = true
                };
            }

            // Tạo record ẩn bài viết
            var hiddenPost = new HiddenPost
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };

            _context.HiddenPosts.Add(hiddenPost);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Đã ẩn bài viết thành công",
                Data = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi ẩn bài viết {PostId} cho user {UserId}", postId, userId);
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi ẩn bài viết"
            };
        }
    }

    // Bỏ ẩn bài viết cho user
    public async Task<ApiResponse<bool>> UnhidePostAsync(int postId, string userId)
    {
        try
        {
            var hiddenPost = await _context.HiddenPosts
                .FirstOrDefaultAsync(h => h.UserId == userId && h.PostId == postId);
            
            if (hiddenPost == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Không tìm thấy bài viết đã ẩn"
                };
            }

            _context.HiddenPosts.Remove(hiddenPost);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Đã bỏ ẩn bài viết thành công",
                Data = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi bỏ ẩn bài viết {PostId} cho user {UserId}", postId, userId);
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi bỏ ẩn bài viết"
            };
        }
    }

    // Lấy danh sách ID bài viết đã ẩn bởi user
    public async Task<ApiResponse<List<int>>> GetHiddenPostIdsAsync(string userId)
    {
        try
        {
            var hiddenPostIds = await _context.HiddenPosts
                .Where(h => h.UserId == userId)
                .Select(h => h.PostId)
                .ToListAsync();

            return new ApiResponse<List<int>>
            {
                Success = true,
                Message = "Lấy danh sách bài viết đã ẩn thành công",
                Data = hiddenPostIds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bài viết đã ẩn cho user {UserId}", userId);
            return new ApiResponse<List<int>>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi lấy danh sách bài viết đã ẩn",
                Data = new List<int>()
            };
        }
    }

    // Admin ?n bai viet (cap nhat IsHidden) va an tat ca binh luan
    public async Task<ApiResponse<bool>> AdminHidePostAsync(int postId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Khong tim thay bai dang");
            }

            post.IsHidden = true;
            post.UpdatedAt = DateTime.UtcNow;

            // An tat ca binh luan cua bai viet
            var comments = await _context.Comments.Where(c => c.PostId == postId && !c.IsDeleted).ToListAsync();
            foreach (var comment in comments)
            {
                comment.IsHidden = true;
                comment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Da an bai dang thanh cong");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi admin an bai dang {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Co loi xay ra khi an bai dang");
        }
    }

    // Admin hien bai viet (cap nhat IsHidden) va hien tat ca binh luan
    public async Task<ApiResponse<bool>> AdminUnhidePostAsync(int postId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Khong tim thay bai dang");
            }

            post.IsHidden = false;
            post.UpdatedAt = DateTime.UtcNow;

            // Hien tat ca binh luan cua bai viet
            var comments = await _context.Comments.Where(c => c.PostId == postId && !c.IsDeleted).ToListAsync();
            foreach (var comment in comments)
            {
                comment.IsHidden = false;
                comment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Da hien bai dang thanh cong");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi admin hien bai dang {PostId}", postId);
            return ApiResponse<bool>.ErrorResult("Co loi xay ra khi hien bai dang");
        }
    }

    // Map entity to DTO
    private PostResponseDto MapToResponse(Post post, string? currentUserId)
    {
        return new PostResponseDto
        {
            Id = post.Id,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            UserId = post.UserId,
            UserName = post.User?.UserName ?? "",
            UserFirstName = post.User?.FirstName,
            UserLastName = post.User?.LastName,
            UserAvatar = post.User?.AvatarUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = post.Likes?.Count(l => l.CommentId == null) ?? 0,
            CommentCount = post.Comments?.Count(c => !c.IsDeleted) ?? 0,
            IsLikedByCurrentUser = currentUserId != null && post.Likes?.Any(l => l.UserId == currentUserId && l.CommentId == null) == true,
            IsHidden = post.IsHidden,
            Hashtags = post.PostHashtags?.Select(ph => ph.Hashtag?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList() ?? new List<string>()
        };
    }
}
