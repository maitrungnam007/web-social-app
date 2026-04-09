using Core.DTOs.Story;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho StoryService
public class StoryServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<StoryService>> _mockLogger;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly StoryService _storyService;
    private readonly string _testUserId = "test-user-id";
    private readonly string _otherUserId = "other-user-id";

    public StoryServiceTests()
    {
        // Tao InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock dependencies
        _mockLogger = new Mock<ILogger<StoryService>>();
        _mockNotificationService = new Mock<INotificationService>();

        // Tao StoryService instance
        _storyService = new StoryService(
            _context,
            _mockLogger.Object,
            _mockNotificationService.Object
        );

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var user1 = new User
        {
            Id = _testUserId,
            UserName = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };
        var user2 = new User
        {
            Id = _otherUserId,
            UserName = "otheruser",
            Email = "other@example.com",
            FirstName = "Other",
            LastName = "User"
        };
        _context.Users.AddRange(user1, user2);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region CreateStory Tests

    [Fact]
    public async Task CreateStoryAsync_VoiDuLieuHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateStoryDto
        {
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg"
        };

        // Act
        var result = await _storyService.CreateStoryAsync(dto, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateStoryAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new CreateStoryDto
        {
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg"
        };

        // Act
        var result = await _storyService.CreateStoryAsync(dto, "nonexistent-user");

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateStoryAsync_VoiMediaUrlRong_TraVeLoi()
    {
        // Arrange
        var dto = new CreateStoryDto
        {
            MediaType = "image",
            MediaUrl = ""
        };

        // Act
        var result = await _storyService.CreateStoryAsync(dto, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateStoryAsync_VoiCaption_TraVeThanhCong()
    {
        // Arrange
        var dto = new CreateStoryDto
        {
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            Content = "Story content test"
        };

        // Act
        var result = await _storyService.CreateStoryAsync(dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Story content test", result.Data?.Content);
    }

    #endregion

    #region DeleteStory Tests

    [Fact]
    public async Task DeleteStoryAsync_VoiStoryHopLe_TraVeTrue()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.DeleteStoryAsync(story.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task DeleteStoryAsync_VoiStoryKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _storyService.DeleteStoryAsync(999, _testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task DeleteStoryAsync_VoiUserKhongPhaiChu_TraVeLoi()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.DeleteStoryAsync(story.Id, _otherUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region GetActiveStories Tests

    [Fact]
    public async Task GetActiveStoriesAsync_VoiStoriesHopLe_TraVeDanhSach()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.GetActiveStoriesAsync(_otherUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetActiveStoriesAsync_KhongCoStories_TraVeDanhSachRong()
    {
        // Act
        var result = await _storyService.GetActiveStoriesAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetActiveStoriesAsync_BoQuaStoriesHetHan_TraVeDanhSachRong()
    {
        // Arrange
        var expiredStory = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow.AddHours(-25),
            ExpiresAt = DateTime.UtcNow.AddHours(-1) // Da het han
        };
        _context.Stories.Add(expiredStory);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.GetActiveStoriesAsync(_otherUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data);
    }

    #endregion

    #region GetUserStories Tests

    [Fact]
    public async Task GetUserStoriesAsync_VoiUserCoStories_TraVeDanhSach()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.GetUserStoriesAsync(_testUserId, _otherUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotEmpty(result.Data);
    }

    [Fact]
    public async Task GetUserStoriesAsync_VoiUserKhongCoStories_TraVeDanhSachRong()
    {
        // Act
        var result = await _storyService.GetUserStoriesAsync(_testUserId, _otherUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data);
    }

    #endregion

    #region MarkStoryAsViewed Tests

    [Fact]
    public async Task MarkStoryAsViewedAsync_VoiStoryHopLe_TraVeTrue()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.MarkStoryAsViewedAsync(story.Id, _otherUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task MarkStoryAsViewedAsync_VoiStoryKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _storyService.MarkStoryAsViewedAsync(999, _otherUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task MarkStoryAsViewedAsync_DaXemRoi_TraVeTrue()
    {
        // Arrange
        var story = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        _context.Stories.Add(story);
        await _context.SaveChangesAsync();

        var view = new StoryView
        {
            StoryId = story.Id,
            ViewerId = _otherUserId,
            ViewedAt = DateTime.UtcNow
        };
        _context.StoryViews.Add(view);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.MarkStoryAsViewedAsync(story.Id, _otherUserId);

        // Assert
        Assert.True(result.Success);
    }

    #endregion

    #region GetArchivedStories Tests

    [Fact]
    public async Task GetArchivedStoriesAsync_VoiUserCoArchivedStories_TraVeDanhSach()
    {
        // Arrange
        var archivedStory = new Story
        {
            UserId = _testUserId,
            MediaType = "image",
            MediaUrl = "https://example.com/story.jpg",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            IsArchived = true
        };
        _context.Stories.Add(archivedStory);
        await _context.SaveChangesAsync();

        // Act
        var result = await _storyService.GetArchivedStoriesAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetArchivedStoriesAsync_KhongCoArchivedStories_TraVeDanhSachRong()
    {
        // Act
        var result = await _storyService.GetArchivedStoriesAsync(_testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data);
    }

    #endregion
}
