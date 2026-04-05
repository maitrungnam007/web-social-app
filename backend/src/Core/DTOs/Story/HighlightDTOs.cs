using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Story;

public class CreateHighlightDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public string? CoverImageUrl { get; set; }
    
    public List<int> StoryIds { get; set; } = new List<int>();
}

public class UpdateHighlightDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public string? CoverImageUrl { get; set; }
}

public class AddStoryToHighlightDto
{
    [Required]
    public int StoryId { get; set; }
}

public class HighlightResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public int StoryCount { get; set; }
    public List<StoryResponseDto> Stories { get; set; } = new List<StoryResponseDto>();
    public DateTime CreatedAt { get; set; }
}

public class ArchivedStoryResponseDto
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int ViewCount { get; set; }
}
