using Core.Enums;

namespace Core.DTOs.Report;

public class CreateReportDto
{
    public ReportTargetType TargetType { get; set; }
    public string TargetId { get; set; } = string.Empty; // String de ho tro ca int (Post/Comment) va GUID (User)
    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
}

public class ReportFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public ReportStatus? Status { get; set; }
    public ReportTargetType? TargetType { get; set; }
    public string? Search { get; set; } // Tim kiem theo noi dung, ten nguoi dung
    public string? SortBy { get; set; } // "newest", "oldest", "mostReported"
}

public class ReportResponseDto
{
    public int Id { get; set; }
    public ReportTargetType TargetType { get; set; }
    public string TargetId { get; set; } = string.Empty;
    
    // Thông tin đối tượng bị báo cáo
    public string? PostContent { get; set; }
    public string? CommentContent { get; set; }
    public string? ReportedUserName { get; set; }
    
    // Người báo cáo
    public string ReporterId { get; set; } = string.Empty;
    public string ReporterName { get; set; } = string.Empty;
    
    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedByName { get; set; }
    public string? ResolutionNotes { get; set; }

    // So luong bao cao cho doi tuong nay
    public int ReportCount { get; set; }
}

public class ResolveReportDto
{
    public ReportStatus Status { get; set; }
    public string? Notes { get; set; }
}
