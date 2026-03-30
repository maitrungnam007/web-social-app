using Core.Enums;

namespace Core.Entities;

public class PostReport
{
    public int Id { get; set; }
    
    public int PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    
    public string ReporterId { get; set; } = string.Empty;
    public virtual User Reporter { get; set; } = null!;
    
    public ReportReason Reason { get; set; }
    
    public string? Description { get; set; }
    
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
}
