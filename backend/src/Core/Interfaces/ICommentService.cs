using Core.DTOs.Common;
using Core.DTOs.Comment;

namespace Core.Interfaces;

public interface ICommentService
{
    Task<ApiResponse<CommentResponseDto>> CreateCommentAsync(CreateCommentDto dto, string userId);
    Task<ApiResponse<CommentResponseDto>> UpdateCommentAsync(int commentId, UpdateCommentDto dto, string userId);
    Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, string userId);
    Task<ApiResponse<List<CommentResponseDto>>> GetCommentsByPostIdAsync(int postId, string? currentUserId);
    Task<ApiResponse<bool>> LikeCommentAsync(int commentId, string userId);
    Task<ApiResponse<bool>> UnlikeCommentAsync(int commentId, string userId);
}
