using Core.DTOs.Common;
using Core.DTOs.Post;
using Core.Entities;
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

    public PostService(ApplicationDbContext context, ILogger<PostService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Tạo bài đăng mới
    public async Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostDto dto, string userId)
    {
        try
        {
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

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa bài đăng thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa bài đăng {PostId}", postId);
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
                    UserAvatar = p.User != null ? p.User.AvatarUrl : null,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    LikeCount = p.Likes.Count(l => l.CommentId == null),
                    CommentCount = p.Comments.Count(c => !c.IsDeleted),
                    IsLikedByCurrentUser = currentUserId != null && p.Likes.Any(l => l.UserId == currentUserId && l.CommentId == null),
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
                .Where(p => !p.IsDeleted);

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
                    UserAvatar = p.User != null ? p.User.AvatarUrl : null,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    LikeCount = p.Likes.Count(l => l.CommentId == null),
                    CommentCount = p.Comments.Count(c => !c.IsDeleted),
                    IsLikedByCurrentUser = currentUserId != null && p.Likes.Any(l => l.UserId == currentUserId && l.CommentId == null),
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
            var post = await _context.Posts.FindAsync(postId);
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

            var like = new Like
            {
                PostId = postId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Likes.Add(like);
            await _context.SaveChangesAsync();

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
            UserAvatar = post.User?.AvatarUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = post.Likes?.Count(l => l.CommentId == null) ?? 0,
            CommentCount = post.Comments?.Count(c => !c.IsDeleted) ?? 0,
            IsLikedByCurrentUser = currentUserId != null && post.Likes?.Any(l => l.UserId == currentUserId && l.CommentId == null) == true,
            Hashtags = post.PostHashtags?.Select(ph => ph.Hashtag?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList() ?? new List<string>()
        };
    }
}
