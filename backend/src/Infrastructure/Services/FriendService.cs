using Core.DTOs.Common;
using Core.DTOs.Friend;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý logic kết bạn
public class FriendService : IFriendService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<FriendService> _logger;

    public FriendService(ApplicationDbContext context, ILogger<FriendService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Gửi lời mời kết bạn
    public async Task<ApiResponse<bool>> SendFriendRequestAsync(string requesterId, string addresseeId)
    {
        try
        {
            // Không thể gửi lời mời cho chính mình
            if (requesterId == addresseeId)
            {
                return ApiResponse<bool>.ErrorResult("Không thể gửi lời mời kết bạn cho chính mình");
            }

            // Kiểm tra người nhận có tồn tại không
            var addressee = await _context.Users.FindAsync(addresseeId);
            if (addressee == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");
            }

            // Kiểm tra đã có mối quan hệ chưa
            var existingFriendship = await _context.Friendships
                .FirstOrDefaultAsync(f => 
                    (f.RequesterId == requesterId && f.AddresseeId == addresseeId) ||
                    (f.RequesterId == addresseeId && f.AddresseeId == requesterId));

            if (existingFriendship != null)
            {
                return existingFriendship.Status switch
                {
                    FriendshipStatus.Pending => ApiResponse<bool>.ErrorResult("Đã gửi lời mời kết bạn trước đó"),
                    FriendshipStatus.Accepted => ApiResponse<bool>.ErrorResult("Hai người đã là bạn bè"),
                    FriendshipStatus.Rejected => ApiResponse<bool>.ErrorResult("Lời mời kết bạn đã bị từ chối"),
                    _ => ApiResponse<bool>.ErrorResult("Đã có mối quan hệ giữa hai người")
                };
            }

            // Tạo lời mời kết bạn mới
            var friendship = new Friendship
            {
                RequesterId = requesterId,
                AddresseeId = addresseeId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã gửi lời mời kết bạn");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi lời mời kết bạn từ {RequesterId} đến {AddresseeId}", requesterId, addresseeId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi gửi lời mời kết bạn");
        }
    }

    // Chấp nhận lời mời kết bạn
    public async Task<ApiResponse<bool>> AcceptFriendRequestAsync(int friendshipId, string userId)
    {
        try
        {
            var friendship = await _context.Friendships.FindAsync(friendshipId);
            if (friendship == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy lời mời kết bạn");
            }

            // Chỉ người được mời mới có thể chấp nhận
            if (friendship.AddresseeId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền chấp nhận lời mời này");
            }

            // Kiểm tra trạng thái
            if (friendship.Status != FriendshipStatus.Pending)
            {
                return ApiResponse<bool>.ErrorResult("Lời mời kết bạn không còn hiệu lực");
            }

            // Cập nhật trạng thái
            friendship.Status = FriendshipStatus.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã chấp nhận lời mời kết bạn");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi chấp nhận lời mời kết bạn {FriendshipId}", friendshipId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi chấp nhận lời mời kết bạn");
        }
    }

    // Từ chối lời mời kết bạn
    public async Task<ApiResponse<bool>> RejectFriendRequestAsync(int friendshipId, string userId)
    {
        try
        {
            var friendship = await _context.Friendships.FindAsync(friendshipId);
            if (friendship == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy lời mời kết bạn");
            }

            // Chỉ người được mời mới có thể từ chối
            if (friendship.AddresseeId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền từ chối lời mời này");
            }

            // Kiểm tra trạng thái
            if (friendship.Status != FriendshipStatus.Pending)
            {
                return ApiResponse<bool>.ErrorResult("Lời mời kết bạn không còn hiệu lực");
            }

            // Cập nhật trạng thái
            friendship.Status = FriendshipStatus.Rejected;
            friendship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã từ chối lời mời kết bạn");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi từ chối lời mời kết bạn {FriendshipId}", friendshipId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi từ chối lời mời kết bạn");
        }
    }

    // Thu hồi lời mời kết bạn
    public async Task<ApiResponse<bool>> CancelFriendRequestAsync(int friendshipId, string userId)
    {
        try
        {
            var friendship = await _context.Friendships.FindAsync(friendshipId);
            if (friendship == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy lời mời kết bạn");
            }

            // Chỉ người gửi mới có thể thu hồi
            if (friendship.RequesterId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Bạn không có quyền thu hồi lời mời này");
            }

            // Kiểm tra trạng thái
            if (friendship.Status != FriendshipStatus.Pending)
            {
                return ApiResponse<bool>.ErrorResult("Lời mời kết bạn không còn hiệu lực để thu hồi");
            }

            // Xóa lời mời
            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã thu hồi lời mời kết bạn");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi thu hồi lời mời kết bạn {FriendshipId}", friendshipId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi thu hồi lời mời kết bạn");
        }
    }

    // Lấy danh sách bạn bè
    public async Task<ApiResponse<List<FriendListDto>>> GetFriendsAsync(string userId)
    {
        try
        {
            // Dùng projection để tránh N+1
            var friends = await _context.Friendships
                .AsNoTracking()
                .Where(f => 
                    (f.RequesterId == userId || f.AddresseeId == userId) &&
                    f.Status == FriendshipStatus.Accepted)
                .Select(f => new FriendListDto
                {
                    Id = f.RequesterId == userId ? f.AddresseeId : f.RequesterId,
                    UserName = f.RequesterId == userId ? (f.Addressee != null ? f.Addressee.UserName : "") : (f.Requester != null ? f.Requester.UserName : ""),
                    FirstName = f.RequesterId == userId ? (f.Addressee != null ? f.Addressee.FirstName : null) : (f.Requester != null ? f.Requester.FirstName : null),
                    LastName = f.RequesterId == userId ? (f.Addressee != null ? f.Addressee.LastName : null) : (f.Requester != null ? f.Requester.LastName : null),
                    AvatarUrl = f.RequesterId == userId ? (f.Addressee != null ? f.Addressee.AvatarUrl : null) : (f.Requester != null ? f.Requester.AvatarUrl : null),
                    Status = f.Status
                })
                .ToListAsync();

            return ApiResponse<List<FriendListDto>>.SuccessResult(friends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bạn bè của user {UserId}", userId);
            return ApiResponse<List<FriendListDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách bạn bè");
        }
    }

    // Lấy danh sách lời mời kết bạn đang chờ
    public async Task<ApiResponse<List<FriendshipResponseDto>>> GetPendingRequestsAsync(string userId)
    {
        try
        {
            var requests = await _context.Friendships
                .AsNoTracking()
                .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
                .Select(f => new FriendshipResponseDto
                {
                    Id = f.Id,
                    RequesterId = f.RequesterId,
                    RequesterName = f.Requester != null ? f.Requester.UserName : "",
                    RequesterAvatar = f.Requester != null ? f.Requester.AvatarUrl : null,
                    AddresseeId = f.AddresseeId,
                    AddresseeName = f.Addressee != null ? f.Addressee.UserName : "",
                    AddresseeAvatar = f.Addressee != null ? f.Addressee.AvatarUrl : null,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<FriendshipResponseDto>>.SuccessResult(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách lời mời kết bạn của user {UserId}", userId);
            return ApiResponse<List<FriendshipResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách lời mời kết bạn");
        }
    }

    // Lấy danh sách lời mời đã gửi
    public async Task<ApiResponse<List<FriendshipResponseDto>>> GetSentRequestsAsync(string userId)
    {
        try
        {
            var requests = await _context.Friendships
                .AsNoTracking()
                .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Pending)
                .Select(f => new FriendshipResponseDto
                {
                    Id = f.Id,
                    RequesterId = f.RequesterId,
                    RequesterName = f.Requester != null ? f.Requester.UserName : "",
                    RequesterAvatar = f.Requester != null ? f.Requester.AvatarUrl : null,
                    AddresseeId = f.AddresseeId,
                    AddresseeName = f.Addressee != null ? f.Addressee.UserName : "",
                    AddresseeAvatar = f.Addressee != null ? f.Addressee.AvatarUrl : null,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<FriendshipResponseDto>>.SuccessResult(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách lời mời đã gửi của user {UserId}", userId);
            return ApiResponse<List<FriendshipResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách lời mời đã gửi");
        }
    }

    // Hủy kết bạn
    public async Task<ApiResponse<bool>> UnfriendAsync(string userId, string friendId)
    {
        try
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f =>
                    ((f.RequesterId == userId && f.AddresseeId == friendId) ||
                     (f.RequesterId == friendId && f.AddresseeId == userId)) &&
                    f.Status == FriendshipStatus.Accepted);

            if (friendship == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy mối quan hệ bạn bè");
            }

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã hủy kết bạn");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi hủy kết bạn giữa {UserId} và {FriendId}", userId, friendId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi hủy kết bạn");
        }
    }

    // Lấy danh sách bạn chung giữa 2 users
    public async Task<ApiResponse<List<MutualFriendDto>>> GetMutualFriendsAsync(string userId, string otherUserId)
    {
        try
        {
            // Lấy danh sách bạn bè của user hiện tại
            var userFriends = await _context.Friendships
                .AsNoTracking()
                .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && 
                            f.Status == FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            // Lấy danh sách bạn bè của user kia
            var otherUserFriends = await _context.Friendships
                .AsNoTracking()
                .Where(f => (f.RequesterId == otherUserId || f.AddresseeId == otherUserId) && 
                            f.Status == FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == otherUserId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            // Tìm bạn chung (intersection)
            var mutualFriendIds = userFriends.Intersect(otherUserFriends).ToList();

            // Lấy thông tin chi tiết của bạn chung
            var mutualFriends = await _context.Users
                .AsNoTracking()
                .Where(u => mutualFriendIds.Contains(u.Id))
                .Select(u => new MutualFriendDto
                {
                    Id = u.Id,
                    UserName = u.UserName ?? "",
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    AvatarUrl = u.AvatarUrl
                })
                .OrderBy(u => u.UserName)
                .Take(5) // Giới hạn 5 bạn chung để hiển thị
                .ToListAsync();

            return ApiResponse<List<MutualFriendDto>>.SuccessResult(mutualFriends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy bạn chung giữa {UserId} và {OtherUserId}", userId, otherUserId);
            return ApiResponse<List<MutualFriendDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách bạn chung");
        }
    }

    // Lấy gợi ý bạn bè (ưu tiên những người có nhiều bạn chung)
    public async Task<ApiResponse<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(string userId, int count = 10)
    {
        try
        {
            // Lấy danh sách bạn bè của user hiện tại
            var userFriends = await _context.Friendships
                .AsNoTracking()
                .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && 
                            f.Status == FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            // Lấy danh sách user đã có mối quan hệ (đã là bạn, đã gửi/đã nhận lời mời)
            var existingRelations = await _context.Friendships
                .AsNoTracking()
                .Where(f => f.RequesterId == userId || f.AddresseeId == userId)
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            // Thêm chính user vào danh sách loại trừ
            existingRelations.Add(userId);

            // Lấy bạn của bạn bè (friends of friends)
            var friendsOfFriends = await _context.Friendships
                .AsNoTracking()
                .Where(f => userFriends.Contains(f.RequesterId) || userFriends.Contains(f.AddresseeId))
                .Where(f => f.Status == FriendshipStatus.Accepted)
                .Select(f => userFriends.Contains(f.RequesterId) ? f.AddresseeId : f.RequesterId)
                .Where(id => !existingRelations.Contains(id))
                .ToListAsync();

            // Đếm số lần xuất hiện (số bạn chung) cho mỗi user
            var mutualCount = friendsOfFriends
                .GroupBy(id => id)
                .Select(g => new { UserId = g.Key, MutualCount = g.Count() })
                .OrderByDescending(x => x.MutualCount)
                .Take(count)
                .ToList();

            if (!mutualCount.Any())
            {
                // Nếu không có friends of friends, lấy random users
                var randomUsers = await _context.Users
                    .AsNoTracking()
                    .Where(u => !existingRelations.Contains(u.Id))
                    .OrderBy(u => Guid.NewGuid())
                    .Take(count)
                    .Select(u => new FriendSuggestionDto
                    {
                        Id = u.Id,
                        UserName = u.UserName ?? "",
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        AvatarUrl = u.AvatarUrl,
                        MutualFriendsCount = 0
                    })
                    .ToListAsync();

                return ApiResponse<List<FriendSuggestionDto>>.SuccessResult(randomUsers);
            }

            // Lấy thông tin chi tiết của các user được gợi ý
            var suggestionIds = mutualCount.Select(x => x.UserId).ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => suggestionIds.Contains(u.Id))
                .Select(u => new FriendSuggestionDto
                {
                    Id = u.Id,
                    UserName = u.UserName ?? "",
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    AvatarUrl = u.AvatarUrl,
                    MutualFriendsCount = 0 // Sẽ gán sau
                })
                .ToListAsync();

            // Gán MutualFriendsCount trong memory
            var mutualDict = mutualCount.ToDictionary(x => x.UserId, x => x.MutualCount);
            foreach (var user in users)
            {
                if (mutualDict.TryGetValue(user.Id, out var mCount))
                {
                    user.MutualFriendsCount = mCount;
                }
            }

            // Sắp xếp theo mutual count
            var sortedSuggestions = users
                .OrderByDescending(u => u.MutualFriendsCount)
                .ToList();

            return ApiResponse<List<FriendSuggestionDto>>.SuccessResult(sortedSuggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy gợi ý bạn bè cho user {UserId}", userId);
            return ApiResponse<List<FriendSuggestionDto>>.ErrorResult("Có lỗi xảy ra khi lấy gợi ý bạn bè");
        }
    }
}
