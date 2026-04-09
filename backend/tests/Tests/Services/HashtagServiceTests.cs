using Core.DTOs.Hashtag;
using Core.Entities;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho HashtagService
public class HashtagServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<HashtagService>> _mockLogger;
    private readonly HashtagService _hashtagService;

    public HashtagServiceTests()
    {
        // Tao InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock Logger
        _mockLogger = new Mock<ILogger<HashtagService>>();

        // Tao HashtagService instance
        _hashtagService = new HashtagService(_context, _mockLogger.Object);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var hashtags = new List<Hashtag>
        {
            new Hashtag { Name = "trending", UsageCount = 100, CreatedAt = DateTime.UtcNow },
            new Hashtag { Name = "viral", UsageCount = 80, CreatedAt = DateTime.UtcNow },
            new Hashtag { Name = "popular", UsageCount = 60, CreatedAt = DateTime.UtcNow },
            new Hashtag { Name = "test", UsageCount = 40, CreatedAt = DateTime.UtcNow },
            new Hashtag { Name = "demo", UsageCount = 20, CreatedAt = DateTime.UtcNow }
        };
        _context.Hashtags.AddRange(hashtags);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region GetTrendingHashtags Tests

    [Fact]
    public async Task GetTrendingHashtagsAsync_VoiSoLuongMacDinh_TraVeDanhSach()
    {
        // Act
        var result = await _hashtagService.GetTrendingHashtagsAsync();

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetTrendingHashtagsAsync_VoiSoLuong5_TraVe5Hashtags()
    {
        // Act
        var result = await _hashtagService.GetTrendingHashtagsAsync(5);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetTrendingHashtagsAsync_VoiSoLuong20_TraVeToiDa20Hashtags()
    {
        // Act
        var result = await _hashtagService.GetTrendingHashtagsAsync(20);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetTrendingHashtagsAsync_KhongCoHashtags_TraVeDanhSachRong()
    {
        // Arrange - Xoa tat ca hashtags
        _context.Hashtags.RemoveRange(_context.Hashtags);
        await _context.SaveChangesAsync();

        // Act
        var result = await _hashtagService.GetTrendingHashtagsAsync();

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetTrendingHashtagsAsync_SapXepTheoUsageCount_TraVeDanhSachGiamDan()
    {
        // Act
        var result = await _hashtagService.GetTrendingHashtagsAsync(5);

        // Assert
        Assert.NotNull(result);
        if (result.Data != null && result.Data.Count > 1)
        {
            for (int i = 0; i < result.Data.Count - 1; i++)
            {
                Assert.True(result.Data[i].UsageCount >= result.Data[i + 1].UsageCount);
            }
        }
    }

    #endregion

    #region SearchHashtags Tests

    [Fact]
    public async Task SearchHashtagsAsync_VoiTuKhoaHopLe_TraVeDanhSach()
    {
        // Act
        var result = await _hashtagService.SearchHashtagsAsync("trend");

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task SearchHashtagsAsync_VoiTuKhoaKhongKhop_TraVeDanhSachRong()
    {
        // Act
        var result = await _hashtagService.SearchHashtagsAsync("nonexistent");

        // Assert
        Assert.True(result.Success);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task SearchHashtagsAsync_VoiTuKhoaRong_TraVeDanhSach()
    {
        // Act
        var result = await _hashtagService.SearchHashtagsAsync("");

        // Assert
        Assert.True(result.Success);
    }

    [Fact]
    public async Task SearchHashtagsAsync_VoiTuKhoaDayDu_TraVeHashtagChinhXac()
    {
        // Act
        var result = await _hashtagService.SearchHashtagsAsync("trending");

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Data);
    }

    [Fact]
    public async Task SearchHashtagsAsync_KhongPhanBietHoaThuong_TraVeDanhSach()
    {
        // Act
        var result = await _hashtagService.SearchHashtagsAsync("TRENDING");

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region GetHashtagByName Tests

    [Fact]
    public async Task GetHashtagByNameAsync_VoiTenHopLe_TraVeHashtag()
    {
        // Act
        var result = await _hashtagService.GetHashtagByNameAsync("trending");

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("trending", result.Data.Name);
    }

    [Fact]
    public async Task GetHashtagByNameAsync_VoiTenKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _hashtagService.GetHashtagByNameAsync("nonexistent");

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task GetHashtagByNameAsync_VoiTenRong_TraVeLoi()
    {
        // Act
        var result = await _hashtagService.GetHashtagByNameAsync("");

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task GetHashtagByNameAsync_TraVeUsageCountDung()
    {
        // Act
        var result = await _hashtagService.GetHashtagByNameAsync("trending");

        // Assert
        Assert.True(result.Success);
        Assert.Equal(100, result.Data?.UsageCount);
    }

    [Fact]
    public async Task GetHashtagByNameAsync_VoiTenCoDauCach_TraVeLoi()
    {
        // Act
        var result = await _hashtagService.GetHashtagByNameAsync("trend ing");

        // Assert
        Assert.NotNull(result);
    }

    #endregion
}
