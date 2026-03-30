using Core.DTOs.Common;
using Core.DTOs.Story;

namespace Core.Interfaces;

public interface IStoryService
{
    Task<ApiResponse<StoryResponseDto>> CreateStoryAsync(CreateStoryDto dto, string userId);
    Task<ApiResponse<bool>> DeleteStoryAsync(int storyId, string userId);
    Task<ApiResponse<List<StoryResponseDto>>> GetActiveStoriesAsync(string? currentUserId);
    Task<ApiResponse<List<StoryResponseDto>>> GetUserStoriesAsync(string userId, string? currentUserId);
    Task<ApiResponse<bool>> MarkStoryAsViewedAsync(int storyId, string viewerId);
}
