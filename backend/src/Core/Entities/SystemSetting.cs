namespace Core.Entities;

// C?u hinh h? th?ng
public class SystemSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "General"; // General, Limits, Moderation
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
