using Core.DTOs.Common;
using Core.DTOs.Post;

namespace Core.Interfaces;

public interface IPostService
{
    Task<ApiResponse<PostResponseDto>> CreatePostAsync(CreatePostDto dto, string userId);
    Task<ApiResponse<PostResponseDto>> UpdatePostAsync(int postId, UpdatePostDto dto, string userId);
    Task<ApiResponse<bool>> DeletePostAsync(int postId, string userId);
    Task<ApiResponse<PostResponseDto>> GetPostByIdAsync(int postId, string? currentUserId);
    Task<ApiResponse<PagedResult<PostResponseDto>>> GetPostsAsync(PostFilterDto filter, string? currentUserId);
    Task<ApiResponse<bool>> LikePostAsync(int postId, string userId);
    Task<ApiResponse<bool>> UnlikePostAsync(int postId, string userId);
    Task<ApiResponse<bool>> HidePostAsync(int postId, string userId);
    Task<ApiResponse<bool>> UnhidePostAsync(int postId, string userId);
    Task<ApiResponse<List<int>>> GetHiddenPostIdsAsync(string userId);
}
