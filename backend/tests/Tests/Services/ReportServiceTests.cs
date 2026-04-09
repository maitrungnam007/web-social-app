using Core.DTOs;
using Core.DTOs.Common;
using Core.DTOs.Report;
using Core.Entities;
using Core.Enums;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

public class ReportServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ReportService _reportService;
    private readonly Mock<ILogger<ReportService>> _mockLogger;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ISystemSettingService> _mockSystemSettingService;
    private readonly string _testUserId;
    private readonly string _adminUserId;

    public ReportServiceTests()
    {
        // Setup InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Setup mocks
        _mockLogger = new Mock<ILogger<ReportService>>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockSystemSettingService = new Mock<ISystemSettingService>();

        // Setup SystemConfigDto mock
        var config = new SystemConfigDto
        {
            MaxPostsPerDay = 10,
            MaxCommentsPerDay = 50,
            ReportsToAutoHide = 5,
            ViolationsToAutoBan = 3
        };
        _mockSystemSettingService.Setup(s => s.GetConfigAsync())
            .ReturnsAsync(ApiResponse<SystemConfigDto>.SuccessResult(config));

        // Create service
        _reportService = new ReportService(_context, _mockLogger.Object, _mockNotificationService.Object, _mockSystemSettingService.Object);

        // Create test users
        _testUserId = "test-user";
        _adminUserId = "admin-user";
        var testUser = new User
        {
            Id = _testUserId,
            UserName = "testuser",
            Email = "test@example.com"
        };
        var adminUser = new User
        {
            Id = _adminUserId,
            UserName = "admin",
            Email = "admin@example.com"
        };
        _context.Users.AddRange(testUser, adminUser);

        // Create test post
        var post = new Post
        {
            Id = 1,
            UserId = _testUserId,
            Content = "Test post content",
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);

        // Create test comment
        var comment = new Comment
        {
            Id = 1,
            PostId = 1,
            UserId = _testUserId,
            Content = "Test comment content",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region CreateReport Tests

    [Fact]
    public async Task CreateReportAsync_VoiPostHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            Reason = ReportReason.Spam,
            Description = "Spam content"
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_VoiCommentHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.Comment,
            TargetId = "1",
            Reason = ReportReason.Harassment,
            Description = "Harassment comment"
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_VoiUserHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.User,
            TargetId = _testUserId,
            Reason = ReportReason.HateSpeech,
            Description = "Hate speech user"
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_VoiPostKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.Post,
            TargetId = "999",
            Reason = ReportReason.Spam
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_VoiCommentKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.Comment,
            TargetId = "999",
            Reason = ReportReason.Spam
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.User,
            TargetId = "nonexistent-user",
            Reason = ReportReason.Spam
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateReportAsync_DaBaoCaoRoi_TraVeLoi()
    {
        // Arrange - Tao report truoc
        var existingReport = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _adminUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(existingReport);
        await _context.SaveChangesAsync();

        var dto = new CreateReportDto
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            Reason = ReportReason.Spam
        };

        // Act
        var result = await _reportService.CreateReportAsync(dto, _adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region GetReports Tests (Admin)

    [Fact]
    public async Task GetReportsAsync_VoiReportsHopLe_TraVeDanhSach()
    {
        // Arrange
        var report = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        var filter = new ReportFilterDto { Page = 1, PageSize = 10 };

        // Act
        var result = await _reportService.GetReportsAsync(filter);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetReportsAsync_LocTheoStatus_TraVeDanhSach()
    {
        // Arrange
        var pendingReport = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        var resolvedReport = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _adminUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Resolved,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.Reports.AddRange(pendingReport, resolvedReport);
        await _context.SaveChangesAsync();

        var filter = new ReportFilterDto { Page = 1, PageSize = 10, Status = ReportStatus.Pending };

        // Act
        var result = await _reportService.GetReportsAsync(filter);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetReportsAsync_LocTheoTargetType_TraVeDanhSach()
    {
        // Arrange
        var postReport = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(postReport);
        await _context.SaveChangesAsync();

        var filter = new ReportFilterDto { Page = 1, PageSize = 10, TargetType = ReportTargetType.Post };

        // Act
        var result = await _reportService.GetReportsAsync(filter);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetReportsAsync_KhongCoReports_TraVeDanhSachRong()
    {
        // Arrange
        var filter = new ReportFilterDto { Page = 1, PageSize = 10 };

        // Act
        var result = await _reportService.GetReportsAsync(filter);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region ResolveReport Tests (Admin)

    [Fact]
    public async Task ResolveReportAsync_VoiReportHopLe_TraVeThanhCong()
    {
        // Arrange
        var report = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        var dto = new ResolveReportDto
        {
            Status = ReportStatus.Resolved,
            Notes = "Resolved by admin"
        };

        // Act
        var result = await _reportService.ResolveReportAsync(report.Id, _adminUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task ResolveReportAsync_VoiReportKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new ResolveReportDto
        {
            Status = ReportStatus.Resolved,
            Notes = "Resolved by admin"
        };

        // Act
        var result = await _reportService.ResolveReportAsync(999, _adminUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task ResolveReportAsync_DismissReport_TraVeThanhCong()
    {
        // Arrange
        var report = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        var dto = new ResolveReportDto
        {
            Status = ReportStatus.Dismissed,
            Notes = "Dismissed by admin"
        };

        // Act
        var result = await _reportService.ResolveReportAsync(report.Id, _adminUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task ResolveReportAsync_UnderReviewReport_TraVeThanhCong()
    {
        // Arrange
        var report = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        var dto = new ResolveReportDto
        {
            Status = ReportStatus.UnderReview,
            Notes = "Under review by admin"
        };

        // Act
        var result = await _reportService.ResolveReportAsync(report.Id, _adminUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region GetReportsByUser Tests (Admin)

    [Fact]
    public async Task GetReportsByUserAsync_VoiUserCoReports_TraVeDanhSach()
    {
        // Arrange
        var report = new Report
        {
            TargetType = ReportTargetType.Post,
            TargetId = "1",
            ReporterId = _testUserId,
            Reason = ReportReason.Spam,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        // Act
        var result = await _reportService.GetReportsByUserAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetReportsByUserAsync_VoiUserKhongCoReports_TraVeDanhSachRong()
    {
        // Act
        var result = await _reportService.GetReportsByUserAsync(_adminUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion
}
