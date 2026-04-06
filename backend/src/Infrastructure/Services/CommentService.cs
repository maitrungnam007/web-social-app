using Core.DTOs.Common;
using Core.DTOs.Comment;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý logic bình luận
public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CommentService> _logger;
    private readonly INotificationService _notificationService;

    public CommentService(ApplicationDbContext context, ILogger<CommentService> logger, INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    // Tạo bình luận mới
    public async Task<ApiResponse<CommentResponseDto>> CreateCommentAsync(CreateCommentDto dto, string userId)
    {
        try
        {
            // Kiểm tra bài đăng tồn tại
            var post = await _context.Posts
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == dto.PostId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<CommentResponseDto>.ErrorResult("Không tìm thấy bài đăng");
            }

            // Kiểm tra comment cha nếu có
            if (dto.ParentCommentId.HasValue)
            {
                var parentComment = await _context.Comments.FindAsync(dto.ParentCommentId.Value);
                if (parentComment == null || parentComment.IsDeleted || parentComment.PostId != dto.PostId)
                {
                    return ApiResponse<CommentResponseDto>.ErrorResult("Bình luận cha không hợp lệ");
                }
            }

            var comment = new Comment
            {
                Content = dto.Content,
                PostId = dto.PostId,
                UserId = userId,
                ParentCommentId = dto.ParentCommentId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Lấy thông tin commenter
            var commenter = await _context.Users.FindAsync(userId);

            // Tạo thông báo cho chủ bài viết (không thông báo khi tự comment bài mình)
            if (post.UserId != userId)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: post.UserId,
                    type: NotificationType.Comment,
                    title: "Bình luận mới",
                    message: $"{commenter?.UserName ?? "Ai đó"} đã bình luận bài viết của bạn",
                    relatedEntityId: dto.PostId.ToString(),
                    relatedEntityType: "Post",
                    actorId: userId
                );
            }

            // Xử lý mentions (@username) trong nội dung comment
            await ProcessMentions(comment.Id, dto.Content, userId, "Comment");

            return await GetCommentByIdAsync(comment.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo bình luận cho bài đăng {PostId}", dto.PostId);
            return ApiResponse<CommentResponseDto>.ErrorResult("Có lỗi xảy ra khi tạo bình luận");
        }
    }

    // Cập nhật bình luận
    public async Task<ApiResponse<CommentResponseDto>> UpdateCommentAsync(int commentId, UpdateCommentDto dto, string userId)
    {
        try
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null || comment.IsDeleted)
            {
                return ApiResponse<CommentResponseDto>.ErrorResult("Không tìm thấy bình luận");
            }

            if (comment.UserId != userId)
            {
                return ApiResponse<CommentResponseDto>.ErrorResult("Bạn không có quyền chỉnh sửa bình luận này");
            }

            comment.Content = dto.Content;
            comment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCommentByIdAsync(commentId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật bình luận {CommentId}", commentId);
            return ApiResponse<CommentResponseDto>.ErrorResult("Có lỗi xảy ra khi cập nhật bình luận");
        }
    }

    // Xóa bình luận
    public async Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, string userId)
    {
        try
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null || comment.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy bình luận");
            }

            if (comment.UserId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền xóa bình luận này");
            }

            comment.IsDeleted = true;
            comment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xóa bình luận thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xóa bình luận {CommentId}", commentId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xóa bình luận");
        }
    }

    // Lấy danh sách bình luận theo bài đăng
    public async Task<ApiResponse<List<CommentResponseDto>>> GetCommentsByPostIdAsync(int postId, string? currentUserId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null || post.IsDeleted)
            {
                return ApiResponse<List<CommentResponseDto>>.ErrorResult("Không tìm thấy bài đăng");
            }

            // Dùng projection để tránh N+1
            var comments = await _context.Comments
                .AsNoTracking()
                .Where(c => c.PostId == postId && !c.IsDeleted)
                .Select(c => new CommentResponseDto
                {
                    Id = c.Id,
                    Content = c.Content,
                    PostId = c.PostId,
                    UserId = c.UserId,
                    UserName = c.User != null ? c.User.UserName : "",
                    UserAvatar = c.User != null ? c.User.AvatarUrl : null,
                    ParentCommentId = c.ParentCommentId,
                    CreatedAt = c.CreatedAt,
                    LikeCount = c.Likes.Count,
                    IsLikedByCurrentUser = currentUserId != null && c.Likes.Any(l => l.UserId == currentUserId)
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            // Xây dựng cây bình luận
            var commentDict = comments.ToDictionary(c => c.Id, c => c);
            var rootComments = new List<CommentResponseDto>();

            foreach (var comment in comments.Where(c => !c.ParentCommentId.HasValue))
            {
                rootComments.Add(commentDict[comment.Id]);
            }

            // Thêm replies vào comment cha
            foreach (var comment in comments.Where(c => c.ParentCommentId.HasValue))
            {
                if (commentDict.TryGetValue(comment.ParentCommentId.Value, out var parent))
                {
                    parent.Replies.Add(commentDict[comment.Id]);
                }
            }

            return ApiResponse<List<CommentResponseDto>>.SuccessResult(rootComments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bình luận của bài đăng {PostId}", postId);
            return ApiResponse<List<CommentResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách bình luận");
        }
    }

    // Thích bình luận
    public async Task<ApiResponse<bool>> LikeCommentAsync(int commentId, string userId)
    {
        try
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null || comment.IsDeleted)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy bình luận");
            }

            // Kiểm tra đã thích chưa
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

            if (existingLike != null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn đã thích bình luận này rồi");
            }

            var like = new Like
            {
                CommentId = commentId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Likes.Add(like);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã thích bình luận");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thích bình luận {CommentId}", commentId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi thích bình luận");
        }
    }

    // Bỏ thích bình luận
    public async Task<ApiResponse<bool>> UnlikeCommentAsync(int commentId, string userId)
    {
        try
        {
            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

            if (like == null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn chưa thích bình luận này");
            }

            _context.Likes.Remove(like);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã bỏ thích bình luận");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi bỏ thích bình luận {CommentId}", commentId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi bỏ thích bình luận");
        }
    }

    // Helper: Lấy comment theo ID
    private async Task<ApiResponse<CommentResponseDto>> GetCommentByIdAsync(int commentId, string userId)
    {
        var comment = await _context.Comments
            .Include(c => c.User)
            .Include(c => c.Likes)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
        {
            return ApiResponse<CommentResponseDto>.ErrorResult("Không tìm thấy bình luận");
        }

        return ApiResponse<CommentResponseDto>.SuccessResult(MapToResponse(comment, userId));
    }

    // Helper: Map entity to DTO
    private CommentResponseDto MapToResponse(Comment comment, string? currentUserId)
    {
        return new CommentResponseDto
        {
            Id = comment.Id,
            Content = comment.Content,
            PostId = comment.PostId,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? "",
            UserAvatar = comment.User?.AvatarUrl,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt,
            LikeCount = comment.Likes?.Count ?? 0,
            IsLikedByCurrentUser = currentUserId != null && comment.Likes?.Any(l => l.UserId == currentUserId) == true,
            Replies = new List<CommentResponseDto>()
        };
    }

    // Xử lý mentions (@username) trong nội dung comment
    private async Task ProcessMentions(int commentId, string content, string authorId, string entityType)
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
                        message: $"{author?.UserName ?? "Ai đó"} đã nhắc đến bạn trong một bình luận",
                        relatedEntityId: commentId.ToString(),
                        relatedEntityType: entityType,
                        actorId: authorId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý mentions cho bình luận {CommentId}", commentId);
        }
    }
}
