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

    // Báo cáo bài đăng
    [HttpPost]
    public async Task<ActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _reportService.CreateReportAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Lấy danh sách báo cáo (Admin)
    [HttpGet]
    // [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] int? status = null)
    {
        var filter = new ReportFilterDto
        {
            Page = page,
            PageSize = pageSize,
            Status = status.HasValue ? (Core.Enums.ReportStatus)status.Value : null
        };
        var result = await _reportService.GetReportsAsync(filter);
        return Ok(result);
    }

    // Xử lý báo cáo (Admin)
    [HttpPut("{id}/resolve")]
    // [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ResolveReport(int id, [FromBody] ResolveReportDto dto)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _reportService.ResolveReportAsync(id, adminId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
