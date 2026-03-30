using Core.DTOs.Common;
using Core.DTOs.Comment;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý logic bình luận
public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _context;

    public CommentService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Tạo bình luận mới
    public async Task<ApiResponse<CommentResponseDto>> CreateCommentAsync(CreateCommentDto dto, string userId)
    {
        // Kiểm tra bài đăng tồn tại
        var post = await _context.Posts.FindAsync(dto.PostId);
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

        return await GetCommentByIdAsync(comment.Id, userId);
    }

    // Cập nhật bình luận
    public async Task<ApiResponse<CommentResponseDto>> UpdateCommentAsync(int commentId, UpdateCommentDto dto, string userId)
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

    // Xóa bình luận
    public async Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, string userId)
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

    // Lấy danh sách bình luận theo bài đăng
    public async Task<ApiResponse<List<CommentResponseDto>>> GetCommentsByPostIdAsync(int postId, string? currentUserId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null || post.IsDeleted)
        {
            return ApiResponse<List<CommentResponseDto>>.ErrorResult("Không tìm thấy bài đăng");
        }

        var comments = await _context.Comments
            .Include(c => c.User)
            .Include(c => c.Likes)
            .Where(c => c.PostId == postId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Xây dựng cây bình luận
        var commentDict = comments.ToDictionary(c => c.Id, c => MapToResponse(c, currentUserId));
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

    // Thích bình luận
    public async Task<ApiResponse<bool>> LikeCommentAsync(int commentId, string userId)
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

    // Bỏ thích bình luận
    public async Task<ApiResponse<bool>> UnlikeCommentAsync(int commentId, string userId)
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
}
