using Core.DTOs.Common;
using Core.DTOs.Friend;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý logic kết bạn
public class FriendService : IFriendService
{
    private readonly ApplicationDbContext _context;

    public FriendService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Gửi lời mời kết bạn
    public async Task<ApiResponse<bool>> SendFriendRequestAsync(string requesterId, string addresseeId)
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

    // Chấp nhận lời mời kết bạn
    public async Task<ApiResponse<bool>> AcceptFriendRequestAsync(int friendshipId, string userId)
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

    // Từ chối lời mời kết bạn
    public async Task<ApiResponse<bool>> RejectFriendRequestAsync(int friendshipId, string userId)
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

    // Thu hồi lời mời kết bạn
    public async Task<ApiResponse<bool>> CancelFriendRequestAsync(int friendshipId, string userId)
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

    // Lấy danh sách bạn bè
    public async Task<ApiResponse<List<FriendListDto>>> GetFriendsAsync(string userId)
    {
        var friendships = await _context.Friendships
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Where(f => 
                (f.RequesterId == userId || f.AddresseeId == userId) &&
                f.Status == FriendshipStatus.Accepted)
            .ToListAsync();

        var friends = friendships.Select(f =>
        {
            // Lấy thông tin bạn bè (người kia trong mối quan hệ)
            var friend = f.RequesterId == userId ? f.Addressee : f.Requester;
            return new FriendListDto
            {
                Id = friend.Id,
                UserName = friend.UserName ?? "",
                FirstName = friend.FirstName,
                LastName = friend.LastName,
                AvatarUrl = friend.AvatarUrl,
                Status = f.Status
            };
        }).ToList();

        return ApiResponse<List<FriendListDto>>.SuccessResult(friends);
    }

    // Lấy danh sách lời mời kết bạn đang chờ
    public async Task<ApiResponse<List<FriendshipResponseDto>>> GetPendingRequestsAsync(string userId)
    {
        var requests = await _context.Friendships
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        var result = requests.Select(f => new FriendshipResponseDto
        {
            Id = f.Id,
            RequesterId = f.RequesterId,
            RequesterName = f.Requester.UserName ?? "",
            RequesterAvatar = f.Requester.AvatarUrl,
            AddresseeId = f.AddresseeId,
            AddresseeName = f.Addressee.UserName ?? "",
            AddresseeAvatar = f.Addressee.AvatarUrl,
            Status = f.Status,
            CreatedAt = f.CreatedAt
        }).ToList();

        return ApiResponse<List<FriendshipResponseDto>>.SuccessResult(result);
    }

    // Lấy danh sách lời mời đã gửi
    public async Task<ApiResponse<List<FriendshipResponseDto>>> GetSentRequestsAsync(string userId)
    {
        var requests = await _context.Friendships
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Pending)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        var result = requests.Select(f => new FriendshipResponseDto
        {
            Id = f.Id,
            RequesterId = f.RequesterId,
            RequesterName = f.Requester.UserName ?? "",
            RequesterAvatar = f.Requester.AvatarUrl,
            AddresseeId = f.AddresseeId,
            AddresseeName = f.Addressee.UserName ?? "",
            AddresseeAvatar = f.Addressee.AvatarUrl,
            Status = f.Status,
            CreatedAt = f.CreatedAt
        }).ToList();

        return ApiResponse<List<FriendshipResponseDto>>.SuccessResult(result);
    }

    // Hủy kết bạn
    public async Task<ApiResponse<bool>> UnfriendAsync(string userId, string friendId)
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
}
