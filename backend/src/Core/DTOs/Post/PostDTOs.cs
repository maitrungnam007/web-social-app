using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Post;

public class CreatePostDto
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string? ImageUrl { get; set; }
    
    public List<string>? Hashtags { get; set; }
}

public class UpdatePostDto
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string? ImageUrl { get; set; }
}

public class PostResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public List<string> Hashtags { get; set; } = new();
}

public class PostFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? UserId { get; set; }
    public string? Hashtag { get; set; }
    public string? SearchTerm { get; set; }
}
