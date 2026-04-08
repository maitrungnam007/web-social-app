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
    private readonly INotificationService _notificationService;

    public ReportService(ApplicationDbContext context, ILogger<ReportService> logger, INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
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
            string targetId = dto.TargetId;

            switch (dto.TargetType)
            {
                case ReportTargetType.Post:
                    if (!int.TryParse(dto.TargetId, out var postTargetId))
                        return ApiResponse<bool>.ErrorResult("ID bài viết không hợp lệ");
                    var post = await _context.Posts.FindAsync(postTargetId);
                    if (post == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy bài đăng");
                    reportedUserId = post.UserId;
                    postId = post.Id;
                    targetId = postTargetId.ToString();
                    break;

                case ReportTargetType.Comment:
                    if (!int.TryParse(dto.TargetId, out var commentTargetId))
                        return ApiResponse<bool>.ErrorResult("ID bình luận không hợp lệ");
                    var comment = await _context.Comments.FindAsync(commentTargetId);
                    if (comment == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy bình luận");
                    reportedUserId = comment.UserId;
                    commentId = comment.Id;
                    targetId = commentTargetId.ToString();
                    break;

                case ReportTargetType.User:
                    var user = await _context.Users.FindAsync(dto.TargetId);
                    if (user == null)
                        return ApiResponse<bool>.ErrorResult("Không tìm thấy người dùng");
                    reportedUserId = user.Id;
                    break;
            }

            // Kiểm tra đã báo cáo chưa
            var existingReport = await _context.Reports
                .FirstOrDefaultAsync(r => r.TargetType == dto.TargetType
                    && r.TargetId == targetId
                    && r.ReporterId == reporterId);

            if (existingReport != null)
            {
                return ApiResponse<bool>.ErrorResult("Bạn đã báo cáo nội dung này rồi");
            }

            // Tạo báo cáo mới
            var report = new Report
            {
                TargetType = dto.TargetType,
                TargetId = targetId,
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
                .Include(r => r.ResolvedByUser)
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

            // Tìm kiếm theo nội dung hoặc tên người dùng
            if (!string.IsNullOrEmpty(filter.Search))
            {
                var searchLower = filter.Search.ToLower();
                query = query.Where(r =>
                    (r.Post != null && r.Post.Content != null && r.Post.Content.ToLower().Contains(searchLower)) ||
                    (r.Comment != null && r.Comment.Content != null && r.Comment.Content.ToLower().Contains(searchLower)) ||
                    (r.ReportedUser != null && r.ReportedUser.UserName != null && r.ReportedUser.UserName.ToLower().Contains(searchLower)) ||
                    (r.Reporter != null && r.Reporter.UserName != null && r.Reporter.UserName.ToLower().Contains(searchLower))
                );
            }

            // Đếm tổng số
            var totalCount = await query.CountAsync();

            List<Report> reports;

            // Xu ly sort dac biet cho mostReported
            if (filter.SortBy == "mostReported")
            {
                // Lay tat ca reports de tinh ReportCount
                var allReports = await query.ToListAsync();

                // Tinh ReportCount cho moi report
                var reportsWithCount = new List<(Report report, int count)>();
                foreach (var report in allReports)
                {
                    var count = await _context.Reports
                        .CountAsync(r => r.TargetType == report.TargetType && r.TargetId == report.TargetId);
                    reportsWithCount.Add((report, count));
                }

                // Sort theo ReportCount descending
                reports = reportsWithCount
                    .OrderByDescending(x => x.count)
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(x => x.report)
                    .ToList();
            }
            else
            {
                // Sap xep binh thuong
                query = filter.SortBy switch
                {
                    "oldest" => query.OrderBy(r => r.CreatedAt),
                    _ => query.OrderByDescending(r => r.CreatedAt) // newest mac dinh
                };

                // Phan trang
                reports = await query
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();
            }

            // Tinh ReportCount cho moi bao cao
            var reportDtos = new List<ReportResponseDto>();
            foreach (var report in reports)
            {
                var dto = MapToDto(report);
                // Dem so bao cao cho cung TargetType va TargetId
                dto.ReportCount = await _context.Reports
                    .CountAsync(r => r.TargetType == report.TargetType && r.TargetId == report.TargetId);
                reportDtos.Add(dto);
            }

            var result = new PagedResult<ReportResponseDto>
            {
                Items = reportDtos,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };

            return ApiResponse<PagedResult<ReportResponseDto>>.SuccessResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi lay danh sach bao cao");
            return ApiResponse<PagedResult<ReportResponseDto>>.ErrorResult("Co loi xay ra khi lay danh sach bao cao");
        }
    }

    // Xu ly bao cao (Admin)
    public async Task<ApiResponse<bool>> ResolveReportAsync(int reportId, string adminId, ResolveReportDto dto)
    {
        try
        {
            var report = await _context.Reports
                .Include(r => r.Post)
                .Include(r => r.Comment)
                .Include(r => r.ReportedUser)
                .Include(r => r.Reporter)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null)
            {
                return ApiResponse<bool>.ErrorResult("Không tìm thấy báo cáo");
            }

            var oldStatus = report.Status;

            // Cập nhật trạng thái
            report.Status = dto.Status;
            report.ResolvedAt = DateTime.UtcNow;
            report.ResolvedBy = adminId;

            // Tăng ViolationCount khi xử lý report (Resolved) và chưa được tính trước đó
            if (dto.Status == ReportStatus.Resolved && !report.ViolationCounted)
            {
                // Kiểm tra xem đã có report nào của target này đã được tính violation chưa
                var alreadyCounted = await _context.Reports
                    .AnyAsync(r => r.TargetType == report.TargetType
                        && r.TargetId == report.TargetId
                        && r.ViolationCounted
                        && r.Id != report.Id);

                if (!alreadyCounted && !string.IsNullOrEmpty(report.ReportedUserId))
                {
                    // Tăng violation count cho user bị báo cáo
                    var reportedUser = await _context.Users.FindAsync(report.ReportedUserId);
                    if (reportedUser != null)
                    {
                        reportedUser.ViolationCount++;
                        report.ViolationCounted = true;
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Tao thong bao cho nguoi bao cao
            var statusLabels = new Dictionary<ReportStatus, string>
            {
                { ReportStatus.Pending, "Chờ xử lý" },
                { ReportStatus.UnderReview, "Đang xem xét" },
                { ReportStatus.Resolved, "Đã xử lý" },
                { ReportStatus.Dismissed, "Bỏ qua" }
            };

            var targetTypeLabels = new Dictionary<ReportTargetType, string>
            {
                { ReportTargetType.Post, "bài viết" },
                { ReportTargetType.Comment, "bình luận" },
                { ReportTargetType.User, "người dùng" }
            };

            await _notificationService.CreateNotificationAsync(
                userId: report.ReporterId,
                type: NotificationType.ReportStatusChanged,
                title: "Cập nhật báo cáo",
                message: $"Báo cáo {targetTypeLabels[report.TargetType]} của bạn đã được cập nhật trạng thái: {statusLabels[dto.Status]}"
            );

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
            ResolvedByName = report.ResolvedByUser?.UserName,
            ResolutionNotes = null
        };
    }

    // L?y bo co theo ng??i b bo co (Admin)
    public async Task<ApiResponse<List<ReportResponseDto>>> GetReportsByUserAsync(string userId)
    {
        try
        {
            var reports = await _context.Reports
                .AsNoTracking()
                .Include(r => r.Reporter)
                .Include(r => r.ResolvedByUser)
                .Where(r => r.TargetType == ReportTargetType.User && r.TargetId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = reports.Select(r => MapToDto(r)).ToList();
            return ApiResponse<List<ReportResponseDto>>.SuccessResult(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "L?i khi l?y bo co theo ng??i dng {UserId}", userId);
            return ApiResponse<List<ReportResponseDto>>.ErrorResult("C l?i x?y ra khi l?y bo co");
        }
    }
}
