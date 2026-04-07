using System.ComponentModel.DataAnnotations;

namespace Core.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "Tên đăng nhập là bắt buộc")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên đăng nhập phải từ 3 đến 50 ký tự")]
    public string UserName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6 đến 100 ký tự")]
    public string Password { get; set; } = string.Empty;
    
    [StringLength(50, ErrorMessage = "Họ không được vượt quá 50 ký tự")]
    public string? FirstName { get; set; }
    
    [StringLength(50, ErrorMessage = "Tên không được vượt quá 50 ký tự")]
    public string? LastName { get; set; }
}

public class LoginDto
{
    [Required(ErrorMessage = "Tên đăng nhập là bắt buộc")]
    public string UserName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
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
    public string? CoverImageUrl { get; set; }
    public string? Bio { get; set; }
    public int FriendsCount { get; set; }
    public string? Role { get; set; }
}
