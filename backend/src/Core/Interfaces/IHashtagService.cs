using Core.DTOs.Common;
using Core.DTOs.Hashtag;

namespace Core.Interfaces;

public interface IHashtagService
{
    Task<ApiResponse<List<HashtagResponseDto>>> GetTrendingHashtagsAsync(int count = 10);
    Task<ApiResponse<List<HashtagResponseDto>>> SearchHashtagsAsync(string searchTerm);
    Task<ApiResponse<HashtagResponseDto>> GetHashtagByNameAsync(string name);
}
