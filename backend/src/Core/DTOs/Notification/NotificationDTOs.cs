using Core.Enums;

namespace Core.DTOs.Notification;

public class NotificationResponseDto
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatar { get; set; }
}

public class NotificationFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? UnreadOnly { get; set; }
}
