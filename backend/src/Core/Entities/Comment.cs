using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Comment
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
    
    public int PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public int? ParentCommentId { get; set; }
    public virtual Comment? ParentComment { get; set; }
    public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public bool IsHidden { get; set; } = false;
    
    // C�c thu?c t�nh di?u hu?ng
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
}
