using Core.DTOs;
using Core.DTOs.Comment;
using Core.DTOs.Common;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho CommentService
public class CommentServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<CommentService>> _mockLogger;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ISystemSettingService> _mockSystemSettingService;
    private readonly CommentService _commentService;
    private readonly string _testUserId = "test-user-id";

    public CommentServiceTests()
    {
        // Tao InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock dependencies
        _mockLogger = new Mock<ILogger<CommentService>>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockSystemSettingService = new Mock<ISystemSettingService>();

        // Setup default config
        _mockSystemSettingService.Setup(s => s.GetConfigAsync())
            .ReturnsAsync(ApiResponse<SystemConfigDto>.SuccessResult(
                new SystemConfigDto { MaxCommentsPerDay = 100 }, "OK"));

        // Tao CommentService instance
        _commentService = new CommentService(
            _context,
            _mockLogger.Object,
            _mockNotificationService.Object,
            _mockSystemSettingService.Object
        );

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var user = new User
        {
            Id = _testUserId,
            UserName = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };
        _context.Users.Add(user);

        var post = new Post
        {
            Id = 1,
            Content = "Test post",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region CreateComment Tests

    [Fact]
    public async Task CreateCommentAsync_VoiDuLieuHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateCommentDto
        {
            PostId = 1,
            Content = "Day la binh luan test"
        };

        // Act
        var result = await _commentService.CreateCommentAsync(dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(dto.Content, result.Data.Content);
    }

    [Fact]
    public async Task CreateCommentAsync_VoiBaiVietKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateCommentDto
        {
            PostId = 999,
            Content = "Binh luan"
        };

        // Act
        var result = await _commentService.CreateCommentAsync(dto, _testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task CreateCommentAsync_VoiNoiDungRong_TraVeLoi()
    {
        // Arrange
        var dto = new CreateCommentDto
        {
            PostId = 1,
            Content = ""
        };

        // Act
        var result = await _commentService.CreateCommentAsync(dto, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateCommentAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateCommentDto
        {
            PostId = 1,
            Content = "Binh luan"
        };

        // Act
        var result = await _commentService.CreateCommentAsync(dto, "nonexistent-user");

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region UpdateComment Tests

    [Fact]
    public async Task UpdateCommentAsync_VoiDuLieuHopLe_TraVeThanhCong()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = _testUserId,
            Content = "Noi dung cu",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var dto = new UpdateCommentDto { Content = "Noi dung moi" };

        // Act
        var result = await _commentService.UpdateCommentAsync(comment.Id, dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Noi dung moi", result.Data?.Content);
    }

    [Fact]
    public async Task UpdateCommentAsync_VoiCommentKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new UpdateCommentDto { Content = "Noi dung moi" };

        // Act
        var result = await _commentService.UpdateCommentAsync(999, dto, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateCommentAsync_VoiUserKhongPhaiChu_TraVeLoi()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = _testUserId,
            Content = "Noi dung cu",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var dto = new UpdateCommentDto { Content = "Noi dung moi" };

        // Act
        var result = await _commentService.UpdateCommentAsync(comment.Id, dto, "other-user");

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region DeleteComment Tests

    [Fact]
    public async Task DeleteCommentAsync_VoiDuLieuHopLe_TraVeTrue()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = _testUserId,
            Content = "Comment can xoa",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.DeleteCommentAsync(comment.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task DeleteCommentAsync_VoiCommentKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _commentService.DeleteCommentAsync(999, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task DeleteCommentAsync_VoiUserKhongPhaiChu_TraVeLoi()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = _testUserId,
            Content = "Comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.DeleteCommentAsync(comment.Id, "other-user");

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region GetComments Tests

    [Fact]
    public async Task GetCommentsByPostIdAsync_VoiPostCoComment_TraVeDanhSach()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = _testUserId,
            Content = "Test comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(1, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotEmpty(result.Data);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_VoiPostKhongCoComment_TraVeDanhSachRong()
    {
        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(1, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_VoiPostKhongTonTai_TraVeDanhSachRong()
    {
        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(999, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region LikeComment Tests

    [Fact]
    public async Task LikeCommentAsync_VoiCommentHopLe_TraVeTrue()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = "other-user",
            Content = "Comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.LikeCommentAsync(comment.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task LikeCommentAsync_VoiCommentKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _commentService.LikeCommentAsync(999, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task LikeCommentAsync_DaLikeRoi_TraVeLoi()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = "other-user",
            Content = "Comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var like = new Like
        {
            CommentId = comment.Id,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Likes.Add(like);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.LikeCommentAsync(comment.Id, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region UnlikeComment Tests

    [Fact]
    public async Task UnlikeCommentAsync_VoiCommentDaLike_TraVeTrue()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = "other-user",
            Content = "Comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var like = new Like
        {
            CommentId = comment.Id,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Likes.Add(like);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.UnlikeCommentAsync(comment.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task UnlikeCommentAsync_ChuaLike_TraVeLoi()
    {
        // Arrange
        var comment = new Comment
        {
            PostId = 1,
            UserId = "other-user",
            Content = "Comment",
            CreatedAt = DateTime.UtcNow
        };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _commentService.UnlikeCommentAsync(comment.Id, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion
}
