using System.ComponentModel.DataAnnotations;

namespace Core.DTOs;

public class SystemSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
}

public class UpdateSystemSettingDto
{
    [Required]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Value { get; set; } = string.Empty;
}

public class BadWordDto
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBadWordDto
{
    [Required]
    [MaxLength(100)]
    public string Word { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = "Profanity"; // Profanity, Spam, Sensitive
}

public class SystemConfigDto
{
    // C?u hinh h? th?ng
    public int DefaultBanDays { get; set; } = 7;
    public bool NotifyOnViolation { get; set; } = true;

    // Gi?i h?n
    public int MaxPostsPerDay { get; set; } = 50;
    public int MaxCommentsPerDay { get; set; } = 200;

    // Quy t?c ki?m duy?t
    public int ReportsToAutoHide { get; set; } = 5;
    public int ViolationsToAutoBan { get; set; } = 3;
    public bool BlockBadWords { get; set; } = true;
}
