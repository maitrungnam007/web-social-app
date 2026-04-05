using Core.Enums;

namespace Core.DTOs.Report;

public class CreateReportDto
{
    public int PostId { get; set; }
    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
}

public class ReportResponseDto
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public string PostContent { get; set; } = string.Empty;
    public string ReporterId { get; set; } = string.Empty;
    public string ReporterName { get; set; } = string.Empty;
    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedByName { get; set; }
}

public class ResolveReportDto
{
    public ReportStatus Status { get; set; }
    public string? Notes { get; set; }
}
