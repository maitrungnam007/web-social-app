namespace Core.Entities;

public class StoryView
{
    public int Id { get; set; }
    
    public int StoryId { get; set; }
    public virtual Story Story { get; set; } = null!;
    
    public string ViewerId { get; set; } = string.Empty;
    public virtual User Viewer { get; set; } = null!;
    
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
