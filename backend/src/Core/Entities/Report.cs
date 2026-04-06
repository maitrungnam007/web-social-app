using Core.Enums;

namespace Core.Entities;

public class Report
{
    public int Id { get; set; }
    
    // Loại đối tượng bị báo cáo (Post, Comment, User)
    public ReportTargetType TargetType { get; set; }
    
    // ID của đối tượng bị báo cáo
    public int TargetId { get; set; }
    
    // Navigation properties - có thể null tùy theo TargetType
    public int? PostId { get; set; }
    public virtual Post? Post { get; set; }
    
    public int? CommentId { get; set; }
    public virtual Comment? Comment { get; set; }
    
    public string? ReportedUserId { get; set; }
    public virtual User? ReportedUser { get; set; }
    
    // Người báo cáo
    public string ReporterId { get; set; } = string.Empty;
    public virtual User Reporter { get; set; } = null!;
    
    public ReportReason Reason { get; set; }
    
    public string? Description { get; set; }
    
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public virtual User? ResolvedByUser { get; set; }
}
