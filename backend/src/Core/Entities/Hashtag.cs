using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Hashtag
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public int UsageCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Các thu?c tính di?u hu?ng
    public virtual ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
}
