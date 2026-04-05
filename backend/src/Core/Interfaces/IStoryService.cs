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
    
    // Story Archive
    Task<ApiResponse<List<ArchivedStoryResponseDto>>> GetArchivedStoriesAsync(string userId);
    
    // Story Highlights
    Task<ApiResponse<List<HighlightResponseDto>>> GetUserHighlightsAsync(string userId);
    Task<ApiResponse<HighlightResponseDto>> CreateHighlightAsync(CreateHighlightDto dto, string userId);
    Task<ApiResponse<HighlightResponseDto>> UpdateHighlightAsync(int highlightId, UpdateHighlightDto dto, string userId);
    Task<ApiResponse<bool>> DeleteHighlightAsync(int highlightId, string userId);
    Task<ApiResponse<bool>> AddStoryToHighlightAsync(int highlightId, AddStoryToHighlightDto dto, string userId);
    Task<ApiResponse<bool>> RemoveStoryFromHighlightAsync(int highlightId, int storyId, string userId);
}
