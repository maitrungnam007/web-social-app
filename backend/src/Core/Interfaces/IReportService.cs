using Core.DTOs.Common;
using Core.DTOs.Report;
using Core.Enums;

namespace Core.Interfaces;

public interface IReportService
{
    Task<ApiResponse<bool>> CreateReportAsync(CreateReportDto dto, string reporterId);
    Task<ApiResponse<PagedResult<ReportResponseDto>>> GetReportsAsync(ReportFilterDto filter);
    Task<ApiResponse<bool>> ResolveReportAsync(int reportId, string adminId, ResolveReportDto dto);
}

public class ReportFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public ReportStatus? Status { get; set; }
}
