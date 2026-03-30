using Core.Enums;

namespace Core.Entities;

public class Notification
{
    public int Id { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public NotificationType Type { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    public string? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; } // "Post", "Comment", "Friendship", v.v.
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
