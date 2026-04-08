namespace Core.Entities;

// T? kh?a c?m
public class BadWord
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string Category { get; set; } = "Profanity"; // Profanity, Spam, Sensitive
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
