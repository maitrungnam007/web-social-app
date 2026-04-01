using Core.DTOs.Common;
using Core.DTOs.Report;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// Service xử lý báo cáo nội dung
public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Tạo báo cáo mới
    public async Task<ApiResponse<bool>> CreateReportAsync(CreateReportDto dto, string reporterId)
    {
        // Kiểm tra post có tồn tại không
        var post = await _context.Posts.FindAsync(dto.PostId);
        if (post == null)
        {
            return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
        }

        // Kiểm tra đã báo cáo chưa
        var existingReport = await _context.PostReports
            .FirstOrDefaultAsync(r => r.PostId == dto.PostId && r.ReporterId == reporterId);

        if (existingReport != null)
        {
            return ApiResponse<bool>.ErrorResult("Bạn đã báo cáo bài đăng này rồi");
        }

        // Tạo báo cáo mới
        var report = new PostReport
        {
            PostId = dto.PostId,
            ReporterId = reporterId,
            Reason = dto.Reason,
            Description = dto.Description,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.PostReports.Add(report);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, "Đã gửi báo cáo");
    }

    // Lấy danh sách báo cáo (Admin)
    public async Task<ApiResponse<PagedResult<ReportResponseDto>>> GetReportsAsync(ReportFilterDto filter)
    {
        var query = _context.PostReports
            .Include(r => r.Post)
            .Include(r => r.Reporter)
            .AsQueryable();

        // Lọc theo trạng thái
        if (filter.Status.HasValue)
        {
            query = query.Where(r => r.Status == filter.Status.Value);
        }

        // Đếm tổng số
        var totalCount = await query.CountAsync();

        // Phân trang
        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var result = new PagedResult<ReportResponseDto>
        {
            Items = reports.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };

        return ApiResponse<PagedResult<ReportResponseDto>>.SuccessResult(result);
    }

    // Xử lý báo cáo (Admin)
    public async Task<ApiResponse<bool>> ResolveReportAsync(int reportId, string adminId, ResolveReportDto dto)
    {
        var report = await _context.PostReports
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            return ApiResponse<bool>.ErrorResult("Không tìm thấy báo cáo");
        }

        // Cập nhật trạng thái
        report.Status = dto.Status;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedBy = adminId;

        // Nếu approved và có notes, có thể xóa post
        if (dto.Status == ReportStatus.Resolved && report.Post != null)
        {
            // Có thể thêm logic xóa post ở đây
            // _context.Posts.Remove(report.Post);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, "Đã xử lý báo cáo");
    }

    // Helper: Map entity to DTO
    private ReportResponseDto MapToDto(PostReport report)
    {
        return new ReportResponseDto
        {
            Id = report.Id,
            PostId = report.PostId,
            PostContent = report.Post?.Content ?? "",
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.UserName ?? "",
            Reason = report.Reason,
            Description = report.Description,
            Status = report.Status,
            CreatedAt = report.CreatedAt,
            ResolvedAt = report.ResolvedAt,
            ResolvedByName = null // Cần join thêm nếu muốn lấy tên admin
        };
    }
}
