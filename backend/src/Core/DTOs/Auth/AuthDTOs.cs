using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string UserName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
    
    [StringLength(50)]
    public string? FirstName { get; set; }
    
    [StringLength(50)]
    public string? LastName { get; set; }
}

public class LoginDto
{
    [Required]
    public string UserName { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public UserDto? User { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
}
