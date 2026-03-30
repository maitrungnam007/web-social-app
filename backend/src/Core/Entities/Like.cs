namespace Core.Entities;

public class Like
{
    public int Id { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public int? PostId { get; set; }
    public virtual Post? Post { get; set; }
    
    public int? CommentId { get; set; }
    public virtual Comment? Comment { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
