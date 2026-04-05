namespace Core.Entities;

public class StoryHighlight
{
    public int Id { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<StoryHighlightItem> Items { get; set; } = new List<StoryHighlightItem>();
}

public class StoryHighlightItem
{
    public int Id { get; set; }
    
    public int HighlightId { get; set; }
    public virtual StoryHighlight Highlight { get; set; } = null!;
    
    public int StoryId { get; set; }
    public virtual Story Story { get; set; } = null!;
    
    public int Order { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
