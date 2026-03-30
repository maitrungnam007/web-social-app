using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Post
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string? ImageUrl { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    
    // Các thu?c tính di?u hu?ng
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
    public virtual ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
    public virtual ICollection<PostReport> Reports { get; set; } = new List<PostReport>();
}
