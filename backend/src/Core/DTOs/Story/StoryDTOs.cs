using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Story;

public class CreateStoryDto
{
    [MaxLength(500)]
    public string? Content { get; set; }
    
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; }
}

public class StoryResponseDto
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? UserFirstName { get; set; }
    public string? UserLastName { get; set; }
    public string? UserAvatar { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int ViewCount { get; set; }
    public bool IsViewedByCurrentUser { get; set; }
}
