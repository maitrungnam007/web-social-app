using Core.DTOs.Common;
using Core.DTOs.Report;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

// Service xử lý báo cáo nội dung (Post, Comment, User)
public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportService> _logger;

    public ReportService(ApplicationDbContext context, ILogger<ReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Tạo báo cáo mới
    public async Task<ApiResponse<bool>> CreateReportAsync(CreateReportDto dto, string reporterId)
    {
        try
        {
            // Kiểm tra đối tượng bị báo cáo có tồn tại không
            string? reportedUserId = null;
            int? postId = null;
            int? commentId = null;

            switch (dto.TargetType)
            {
                case ReportTargetType.Post:
                    var post = await _context.Posts.FindAsync(dto.TargetId);
                    if (post == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
                    reportedUserId = post.UserId;
                    postId = post.Id;
                    break;

                case ReportTargetType.Comment:
                    var comment = await _context.Comments.FindAsync(dto.TargetId);
                    if (comment == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy bình luận");
                    reportedUserId = comment.UserId;
                    commentId = comment.Id;
                    break;

                case ReportTargetType.User:
                    var user = await _context.Users.FindAsync(dto.TargetId.ToString());
                    if (user == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");
                    reportedUserId = user.Id;
                    break;
            }

            // Kiểm tra đã báo cáo chưa
            var existingReport = await _context.Reports
                .FirstOrDefaultAsync(r => r.TargetType == dto.TargetType 
                    && r.TargetId == dto.TargetId 
                    && r.ReporterId == reporterId);

            if (existingReport != null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn đã báo cáo nội dung này rồi");
            }

            // Tạo báo cáo mới
            var report = new Report
            {
                TargetType = dto.TargetType,
                TargetId = dto.TargetId,
                PostId = postId,
                CommentId = commentId,
                ReportedUserId = reportedUserId,
                ReporterId = reporterId,
                Reason = dto.Reason,
                Description = dto.Description,
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã gửi báo cáo thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo báo cáo {TargetType} {TargetId}", dto.TargetType, dto.TargetId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi gửi báo cáo");
        }
    }

    // Lấy danh sách báo cáo (Admin)
    public async Task<ApiResponse<PagedResult<ReportResponseDto>>> GetReportsAsync(ReportFilterDto filter)
    {
        try
        {
            var query = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.Post)
                .Include(r => r.Comment)
                .Include(r => r.ReportedUser)
                .AsQueryable();

            // Lọc theo trạng thái
            if (filter.Status.HasValue)
            {
                query = query.Where(r => r.Status == filter.Status.Value);
            }

            // Lọc theo loại đối tượng
            if (filter.TargetType.HasValue)
            {
                query = query.Where(r => r.TargetType == filter.TargetType.Value);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách báo cáo");
            return ApiResponse<PagedResult<ReportResponseDto>>.ErrorResult("Có lỗi xảy ra khi lấy danh sách báo cáo");
        }
    }

    // Xử lý báo cáo (Admin)
    public async Task<ApiResponse<bool>> ResolveReportAsync(int reportId, string adminId, ResolveReportDto dto)
    {
        try
        {
            var report = await _context.Reports
                .Include(r => r.Post)
                .Include(r => r.Comment)
                .Include(r => r.ReportedUser)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy báo cáo");
            }

            // Cập nhật trạng thái
            report.Status = dto.Status;
            report.ResolvedAt = DateTime.UtcNow;
            report.ResolvedBy = adminId;

            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResult(true, "Đã xử lý báo cáo thành công");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý báo cáo {ReportId}", reportId);
            return ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xử lý báo cáo");
        }
    }

    // Helper: Map entity to DTO
    private ReportResponseDto MapToDto(Report report)
    {
        string? postContent = null;
        string? commentContent = null;
        string? reportedUserName = null;

        // Lấy nội dung dựa trên loại đối tượng
        switch (report.TargetType)
        {
            case ReportTargetType.Post:
                postContent = report.Post?.Content;
                break;
            case ReportTargetType.Comment:
                commentContent = report.Comment?.Content;
                break;
            case ReportTargetType.User:
                reportedUserName = report.ReportedUser?.UserName;
                break;
        }

        return new ReportResponseDto
        {
            Id = report.Id,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            PostContent = postContent,
            CommentContent = commentContent,
            ReportedUserName = reportedUserName,
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.UserName ?? "",
            Reason = report.Reason,
            Description = report.Description,
            Status = report.Status,
            CreatedAt = report.CreatedAt,
            ResolvedAt = report.ResolvedAt,
            ResolutionNotes = null
        };
    }
}
