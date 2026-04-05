using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Story
{
    public int Id { get; set; }
    
    [MaxLength(500)]
    public string? Content { get; set; }
    
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    public bool IsDeleted { get; set; } = false;
    public bool IsArchived { get; set; } = true;
    
    public virtual ICollection<StoryView> StoryViews { get; set; } = new List<StoryView>();
    public virtual ICollection<StoryHighlightItem> HighlightItems { get; set; } = new List<StoryHighlightItem>();
}
