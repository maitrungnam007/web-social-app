using Core.DTOs.Common;
using Core.DTOs.Report;

namespace Core.Interfaces;

public interface IReportService
{
    Task<ApiResponse<bool>> CreateReportAsync(CreateReportDto dto, string reporterId);
    Task<ApiResponse<PagedResult<ReportResponseDto>>> GetReportsAsync(ReportFilterDto filter);
    Task<ApiResponse<bool>> ResolveReportAsync(int reportId, string adminId, ResolveReportDto dto);
    Task<ApiResponse<List<ReportResponseDto>>> GetReportsByUserAsync(string userId);
}
