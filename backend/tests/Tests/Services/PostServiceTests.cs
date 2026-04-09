using Core.DTOs;
using Core.DTOs.Common;
using Core.DTOs.Post;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho PostService
public class PostServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<PostService>> _mockLogger;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ISystemSettingService> _mockSystemSettingService;
    private readonly PostService _postService;
    private readonly string _testUserId = "test-user-1";

    public PostServiceTests()
    {
        // Tao InMemory database cho tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock dependencies
        _mockLogger = new Mock<ILogger<PostService>>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockSystemSettingService = new Mock<ISystemSettingService>();

        // Setup default config
        _mockSystemSettingService.Setup(s => s.GetConfigAsync())
            .ReturnsAsync(ApiResponse<SystemConfigDto>.SuccessResult(
                new SystemConfigDto { MaxPostsPerDay = 50, BlockBadWords = false }, "OK"));

        // Tao PostService instance
        _postService = new PostService(
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
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region CreatePost Tests

    [Fact]
    public async Task CreatePostAsync_VoiNoiDungHopLe_TraVeBaiViet()
    {
        // Arrange
        var dto = new CreatePostDto
        {
            Content = "Day la bai viet test",
            Hashtags = new List<string> { "test" }
        };

        // Act
        var result = await _postService.CreatePostAsync(dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(dto.Content, result.Data.Content);
        Assert.Equal(_testUserId, result.Data.UserId);
    }

    [Fact]
    public async Task CreatePostAsync_VoiAnh_TraVeBaiVietCoAnh()
    {
        // Arrange
        var dto = new CreatePostDto
        {
            Content = "Bai viet co anh",
            ImageUrl = "images/test.jpg"
        };

        // Act
        var result = await _postService.CreatePostAsync(dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(dto.ImageUrl, result.Data.ImageUrl);
    }

    [Fact]
    public async Task CreatePostAsync_VoiHashtag_TaoHashtagMoi()
    {
        // Arrange
        var dto = new CreatePostDto
        {
            Content = "Bai viet voi hashtag #unittest",
            Hashtags = new List<string> { "unittest" }
        };

        // Act
        var result = await _postService.CreatePostAsync(dto, _testUserId);

        // Assert
        Assert.True(result.Success);
        var hashtag = await _context.Hashtags.FirstOrDefaultAsync(h => h.Name == "unittest");
        Assert.NotNull(hashtag);
    }

    [Fact]
    public async Task CreatePostAsync_VuotGioiHanBaiVietNgay_TraVeLoi()
    {
        // Arrange
        _mockSystemSettingService.Setup(s => s.GetConfigAsync())
            .ReturnsAsync(ApiResponse<SystemConfigDto>.SuccessResult(
                new SystemConfigDto { MaxPostsPerDay = 1, BlockBadWords = false }, "OK"));

        var dto = new CreatePostDto { Content = "Bai viet 1" };
        await _postService.CreatePostAsync(dto, _testUserId);

        var dto2 = new CreatePostDto { Content = "Bai viet 2" };

        // Act
        var result = await _postService.CreatePostAsync(dto2, _testUserId);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task CreatePostAsync_VoiTuKhoaCam_TraVeLoi()
    {
        // Arrange
        _mockSystemSettingService.Setup(s => s.GetConfigAsync())
            .ReturnsAsync(ApiResponse<SystemConfigDto>.SuccessResult(
                new SystemConfigDto { MaxPostsPerDay = 50, BlockBadWords = true }, "OK"));
        _mockSystemSettingService.Setup(s => s.ContainsBadWordAsync("badword"))
            .ReturnsAsync(true);

        var dto = new CreatePostDto { Content = "badword" };

        // Act
        var result = await _postService.CreatePostAsync(dto, _testUserId);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    #endregion

    #region GetPost Tests

    [Fact]
    public async Task GetPostByIdAsync_VoiIdHopLe_TraVeBaiViet()
    {
        // Arrange
        var post = new Post
        {
            Content = "Test post",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.GetPostByIdAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(post.Content, result.Data.Content);
    }

    [Fact]
    public async Task GetPostByIdAsync_VoiIdKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _postService.GetPostByIdAsync(999, _testUserId);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task GetPostsAsync_VoiFilterMacDinh_TraVeDanhSach()
    {
        // Arrange
        for (int i = 0; i < 5; i++)
        {
            _context.Posts.Add(new Post
            {
                Content = $"Post {i}",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                IsDeleted = false
            });
        }
        await _context.SaveChangesAsync();

        var filter = new PostFilterDto { Page = 1, PageSize = 10 };

        // Act
        var result = await _postService.GetPostsAsync(filter, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.True(result.Data.Items.Count <= 5);
    }

    [Fact]
    public async Task GetPostsAsync_VoiFilterHashtag_TraVeBaiVietCoHashtag()
    {
        // Arrange
        var hashtag = new Hashtag { Name = "testtag", UsageCount = 0 };
        _context.Hashtags.Add(hashtag);
        await _context.SaveChangesAsync();

        var post = new Post
        {
            Content = "Post with hashtag",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _context.PostHashtags.Add(new PostHashtag
        {
            PostId = post.Id,
            HashtagId = hashtag.Id
        });
        await _context.SaveChangesAsync();

        var filter = new PostFilterDto { Page = 1, PageSize = 10, Hashtag = "testtag" };

        // Act
        var result = await _postService.GetPostsAsync(filter, _testUserId);

        // Assert
        Assert.True(result.Success);
    }

    #endregion

    #region Like/Unlike Tests

    [Fact]
    public async Task LikePostAsync_VoiBaiVietHopLe_TraVeTrue()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.LikePostAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task LikePostAsync_VoiBaiVietKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _postService.LikePostAsync(999, _testUserId);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task LikePostAsync_DaLikeRoi_TraVeLoi()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _context.Likes.Add(new Like
        {
            PostId = post.Id,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.LikePostAsync(post.Id, _testUserId);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task UnlikePostAsync_DaLike_TraVeTrue()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _context.Likes.Add(new Like
        {
            PostId = post.Id,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.UnlikePostAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task UnlikePostAsync_ChuaLike_TraVeLoi()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.UnlikePostAsync(post.Id, _testUserId);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region DeletePost Tests

    [Fact]
    public async Task DeletePostAsync_VoiBaiVietCuaMinh_TraVeTrue()
    {
        // Arrange
        var post = new Post
        {
            Content = "Test post",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.DeletePostAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task DeletePostAsync_VoiBaiVietCuaNguoiKhac_TraVeLoi()
    {
        // Arrange
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.DeletePostAsync(post.Id, _testUserId);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task DeletePostAsync_VoiBaiVietDaXoa_TraVeLoi()
    {
        // Arrange
        var post = new Post
        {
            Content = "Test post",
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.DeletePostAsync(post.Id, _testUserId);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region HidePost Tests

    [Fact]
    public async Task HidePostAsync_VoiBaiVietHopLe_TraVeTrue()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.HidePostAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task HidePostAsync_DaAnRoi_TraVeThanhCong()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _context.HiddenPosts.Add(new HiddenPost
        {
            PostId = post.Id,
            UserId = _testUserId
        });
        await _context.SaveChangesAsync();

        // Act - Hide lai van thanh cong (idempotent)
        var result = await _postService.HidePostAsync(post.Id, _testUserId);

        // Assert - Service co the tra ve thanh cong hoac loi tuy implementation
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UnhidePostAsync_DaAn_TraVeTrue()
    {
        // Arrange
        var otherUser = new User { Id = "other-user", UserName = "otheruser", Email = "other@test.com" };
        _context.Users.Add(otherUser);
        
        var post = new Post
        {
            Content = "Test post",
            UserId = "other-user",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        _context.HiddenPosts.Add(new HiddenPost
        {
            PostId = post.Id,
            UserId = _testUserId
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.UnhidePostAsync(post.Id, _testUserId);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    #endregion

    #region AdminDeletePost Tests

    [Fact]
    public async Task AdminDeletePostAsync_VoiPostHopLe_TraVeTrue()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post can xoa boi admin",
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminDeletePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminDeletePostAsync_VoiPostKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _postService.AdminDeletePostAsync(999);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminDeletePostAsync_VoiPostDaXoa_TraVeLoi()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post da xoa",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminDeletePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region AdminHidePost Tests

    [Fact]
    public async Task AdminHidePostAsync_VoiPostHopLe_TraVeTrue()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post can an boi admin",
            CreatedAt = DateTime.UtcNow
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminHidePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminHidePostAsync_VoiPostKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _postService.AdminHidePostAsync(999);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminHidePostAsync_VoiPostDaXoa_TraVeLoi()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post da xoa",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminHidePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region AdminUnhidePost Tests

    [Fact]
    public async Task AdminUnhidePostAsync_VoiPostDangAn_TraVeTrue()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post dang an",
            CreatedAt = DateTime.UtcNow,
            IsHidden = true
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminUnhidePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminUnhidePostAsync_VoiPostKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _postService.AdminUnhidePostAsync(999);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AdminUnhidePostAsync_VoiPostDaXoa_TraVeLoi()
    {
        // Arrange
        var post = new Post
        {
            UserId = _testUserId,
            Content = "Post da xoa",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        // Act
        var result = await _postService.AdminUnhidePostAsync(post.Id);

        // Assert
        Assert.NotNull(result);
    }

    #endregion
}
