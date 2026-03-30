using Core.DTOs.Common;
using Core.DTOs.Notification;

namespace Core.Interfaces;

public interface INotificationService
{
    Task<ApiResponse<PagedResult<NotificationResponseDto>>> GetNotificationsAsync(string userId, NotificationFilterDto filter);
    Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId, string userId);
    Task<ApiResponse<bool>> MarkAllAsReadAsync(string userId);
    Task<ApiResponse<int>> GetUnreadCountAsync(string userId);
}
