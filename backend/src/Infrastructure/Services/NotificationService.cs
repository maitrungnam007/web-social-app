using Core.DTOs.Common;
using Core.DTOs.Notification;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý thông báo người dùng
public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Lấy danh sách thông báo có phân trang
    public async Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(string userId, NotificationFilterDto filter)
    {
        var query = _context.Notifications
            .Include(n => n.User)
            .Where(n => n.UserId == userId);

        // Lọc theo trạng thái đã đọc
        if (filter.UnreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        // Đếm tổng số
        var totalCount = await query.CountAsync();

        // Phân trang
        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var result = new PagedResult<NotificationResponseDto>
        {
            Items = notifications.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };

        return ApiResponse<PagedResult<NotificationResponseDto>>.SuccessResult(result);
    }

    // Đánh dấu đã đọc một thông báo
    public async Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId, string userId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null)
        {
            return ApiResponse<bool>.ErrorResult("Không tìm thấy thông báo");
        }

        // Kiểm tra quyền
        if (notification.UserId != userId)
        {
            return ApiResponse<bool>.ErrorResult("Bạn không có quyền thực hiện hành động này");
        }

        if (notification.IsRead)
        {
            return ApiResponse<bool>.SuccessResult(true, "Thông báo đã được đọc");
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, "Đã đánh dấu đã đọc");
    }

    // Đánh dấu đã đọc tất cả thông báo
    public async Task<ApiResponse<bool>> MarkAllAsReadAsync(string userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (!unreadNotifications.Any())
        {
            return ApiResponse<bool>.SuccessResult(true, "Không có thông báo chưa đọc");
        }

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, $"Đã đánh dấu đã đọc {unreadNotifications.Count} thông báo");
    }

    // Lấy số lượng thông báo chưa đọc
    public async Task<ApiResponse<int>> GetUnreadCountAsync(string userId)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return ApiResponse<int>.SuccessResult(count);
    }

    // Helper: Map entity to DTO
    private NotificationResponseDto MapToDto(Notification notification)
    {
        return new NotificationResponseDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            RelatedEntityId = notification.RelatedEntityId,
            RelatedEntityType = notification.RelatedEntityType,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ActorName = notification.User?.UserName,
            ActorAvatar = notification.User?.AvatarUrl
        };
    }
}
