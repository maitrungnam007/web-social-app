using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Story
{
    public int Id { get; set; }
    
    [MaxLength(500)]
    public string? Content { get; set; }
    
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; } // "image" ho?c "video"
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    public bool IsDeleted { get; set; } = false;
    
    // Các thu?c tính di?u hu?ng
    public virtual ICollection<StoryView> StoryViews { get; set; } = new List<StoryView>();
}
