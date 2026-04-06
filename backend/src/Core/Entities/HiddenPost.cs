namespace Core.Entities;

// Entity lưu thông tin bài viết bị ẩn bởi user
// Mỗi user có thể ẩn các bài viết khác nhau, chỉ user đó thấy bài viết bị ẩn
public class HiddenPost
{
    public int Id { get; set; }
    
    // ID của user đã ẩn bài viết
    public string UserId { get; set; } = string.Empty;
    
    // Navigation property đến User
    public User User { get; set; } = null!;
    
    // ID của bài viết bị ẩn
    public int PostId { get; set; }
    
    // Navigation property đến Post
    public Post Post { get; set; } = null!;
    
    // Thời gian ẩn bài viết
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
