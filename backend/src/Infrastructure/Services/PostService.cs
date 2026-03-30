using Core.DTOs.Common;
using Core.DTOs.Post;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý logic bài đăng
public class PostService : IPostService
{
    private readonly ApplicationDbContext _context;

    public PostService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Tạo bài đăng mới
    public async Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostDto dto, string userId)
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

    // Cập nhật bài đăng
    public async Task<ApiResponse<PostResponseDto>> UpdatePostAsync(int postId, UpdatePostDto dto, string userId)
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

    // Xóa bài đăng
    public async Task<ApiResponse<bool>> DeletePostAsync(int postId, string userId)
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

    // Lấy bài đăng theo ID
    public async Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(int postId, string? currentUserId)
    {
        var post = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
            .FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);

        if (post == null)
        {
            return ApiResponse<PostResponseDto>.ErrorResult("Không tìm thấy bài đăng");
        }

        var response = MapToResponse(post, currentUserId);
        return ApiResponse<PostResponseDto>.SuccessResult(response);
    }

    // Lấy danh sách bài đăng có phân trang
    public async Task<ApiResponse<PagedResult<PostResponseDto>>> GetPostsAsync(PostFilterDto filter, string? currentUserId)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.PostHashtags).ThenInclude(ph => ph.Hashtag)
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

        // Sắp xếp theo thời gian tạo giảm dần
        query = query.OrderByDescending(p => p.CreatedAt);

        // Phân trang
        var totalCount = await query.CountAsync();
        var posts = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var items = posts.Select(p => MapToResponse(p, currentUserId)).ToList();

        var result = new PagedResult<PostResponseDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };

        return ApiResponse<PagedResult<PostResponseDto>>.SuccessResult(result);
    }

    // Thích bài đăng
    public async Task<ApiResponse<bool>> LikePostAsync(int postId, string userId)
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

    // Bỏ thích bài đăng
    public async Task<ApiResponse<bool>> UnlikePostAsync(int postId, string userId)
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
