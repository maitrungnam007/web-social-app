using Core.DTOs.Common;
using Core.DTOs.Friend;

namespace Core.Interfaces;

public interface IFriendService
{
    Task<ApiResponse<bool>> SendFriendRequestAsync(string requesterId, string addresseeId);
    Task<ApiResponse<bool>> CancelFriendRequestAsync(int friendshipId, string userId);
    Task<ApiResponse<bool>> AcceptFriendRequestAsync(int friendshipId, string userId);
    Task<ApiResponse<bool>> RejectFriendRequestAsync(int friendshipId, string userId);
    Task<ApiResponse<List<FriendListDto>>> GetFriendsAsync(string userId);
    Task<ApiResponse<List<FriendshipResponseDto>>> GetPendingRequestsAsync(string userId);
    Task<ApiResponse<List<FriendshipResponseDto>>> GetSentRequestsAsync(string userId);
    Task<ApiResponse<bool>> UnfriendAsync(string userId, string friendId);
    Task<ApiResponse<List<MutualFriendDto>>> GetMutualFriendsAsync(string userId, string otherUserId);
    Task<ApiResponse<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(string userId, int count = 10);
    Task<ApiResponse<List<MentionUserDto>>> SearchFriendsForMentionAsync(string userId, string query);
}
