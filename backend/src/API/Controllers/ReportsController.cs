using Core.DTOs.Report;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    // Báo cáo nội dung (Post, Comment, User)
    [HttpPost]
    public async Task<ActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _reportService.CreateReportAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Lấy danh sách báo cáo (Admin)
    [HttpGet]
    // [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetReports(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? targetType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null)
    {
        var filter = new ReportFilterDto
        {
            Page = page,
            PageSize = pageSize,
            Status = !string.IsNullOrEmpty(status) && Enum.TryParse<Core.Enums.ReportStatus>(status, out var statusValue) ? statusValue : null,
            TargetType = !string.IsNullOrEmpty(targetType) && Enum.TryParse<Core.Enums.ReportTargetType>(targetType, out var typeValue) ? typeValue : null,
            Search = search,
            SortBy = sortBy
        };
        var result = await _reportService.GetReportsAsync(filter);
        return Ok(result);
    }

    // Xử lý báo cáo (Admin)
    [HttpPut("{id}/resolve")]
    // [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ResolveReport(int id, [FromBody] ResolveReportDto dto)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId))
            return Unauthorized();

        var result = await _reportService.ResolveReportAsync(id, adminId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
