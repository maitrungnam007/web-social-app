using Core.DTOs.Common;
using Core.DTOs.Notification;
using Core.Enums;

namespace Core.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(string userId, NotificationFilterDto filter);
    Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId, string userId);
    Task<ApiResponse<bool>> MarkAllAsReadAsync(string userId);
    Task<ApiResponse<int>> GetUnreadCountAsync(string userId);
    
    // Tạo thông báo mới
    Task CreateNotificationAsync(
        string userId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityId = null,
        string? relatedEntityType = null,
        string? actorId = null
    );
}
