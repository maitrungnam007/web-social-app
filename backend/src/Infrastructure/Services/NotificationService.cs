using Core.DTOs.Common;
using Core.DTOs.Notification;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý thông báo người dùng
public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Tạo thông báo mới
    public async Task CreateNotificationAsync(
        string userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityId = null,
        string? relatedEntityType = null,
        string? actorId = null
    )
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = relatedEntityType,
                ActorId = actorId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo thông báo cho user {UserId}", userId);
        }
    }

    // Lấy danh sách thông báo có phân trang
    public async Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(string userId, NotificationFilterDto filter)
    {
        try
        {
            var query = _context.Notifications
                .Include(n => n.Actor)
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách thông báo của user {UserId}", userId);
            return ApiResponse<PagedResult<NotificationResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách thông báo");
        }
    }

    // Đánh dấu đã đọc một thông báo
    public async Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId, string userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đánh dấu đã đọc thông báo {NotificationId}", notificationId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi đánh dấu đã đọc");
        }
    }

    // Đánh dấu đã đọc tất cả thông báo
    public async Task<ApiResponse<bool>> MarkAllAsReadAsync(string userId)
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đánh dấu đã đọc tất cả thông báo của user {UserId}", userId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi đánh dấu đã đọc tất cả thông báo");
        }
    }

    // Lấy số lượng thông báo chưa đọc
    public async Task<ApiResponse<int>> GetUnreadCountAsync(string userId)
    {
        try
        {
            var count = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return ApiResponse<int>.SuccessResult(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đếm thông báo chưa đọc của user {UserId}", userId);
            return ApiResponse<int>.ErrorResult("Có lỗi xảy ra khi đếm thông báo chưa đọc");
        }
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
            ActorName = notification.Actor?.UserName,
            ActorAvatar = notification.Actor?.AvatarUrl
        };
    }
}
