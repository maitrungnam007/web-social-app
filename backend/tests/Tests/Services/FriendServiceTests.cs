using Core.DTOs.Common;
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

// Unit tests cho FriendService
public class FriendServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<FriendService>> _mockLogger;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly FriendService _friendService;
    private readonly string _user1Id = "user-1";
    private readonly string _user2Id = "user-2";
    private readonly string _user3Id = "user-3";

    public FriendServiceTests()
    {
        // Tao InMemory database cho tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock dependencies
        _mockLogger = new Mock<ILogger<FriendService>>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockNotificationService.Setup(n => n.CreateNotificationAsync(
            It.IsAny<string>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        // Tao FriendService instance
        _friendService = new FriendService(
            _context,
            _mockLogger.Object,
            _mockNotificationService.Object
        );

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Users.AddRange(
            new User { Id = _user1Id, UserName = "user1", Email = "user1@test.com" },
            new User { Id = _user2Id, UserName = "user2", Email = "user2@test.com" },
            new User { Id = _user3Id, UserName = "user3", Email = "user3@test.com" }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region SendFriendRequest Tests

    [Fact]
    public async Task SendFriendRequestAsync_VoiNguoiDungHopLe_TraVeTrue()
    {
        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task SendFriendRequestAsync_VoiChinhMinh_TraVeLoi()
    {
        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, _user1Id);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task SendFriendRequestAsync_VoiNguoiDungKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, "nonexistent");

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task SendFriendRequestAsync_DaGuiLoiMoi_TraVeLoi()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, _user2Id);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task SendFriendRequestAsync_DaLaBanBe_TraVeLoi()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, _user2Id);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task SendFriendRequestAsync_DaBiTuChoi_TraVeLoi()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Rejected,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.SendFriendRequestAsync(_user1Id, _user2Id);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    #endregion

    #region AcceptFriendRequest Tests

    [Fact]
    public async Task AcceptFriendRequestAsync_VoiLoiMoiHopLe_TraVeTrue()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.AcceptFriendRequestAsync(friendship.Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);

        var updated = await _context.Friendships.FindAsync(friendship.Id);
        Assert.Equal(FriendshipStatus.Accepted, updated!.Status);
    }

    [Fact]
    public async Task AcceptFriendRequestAsync_KhongPhaiNguoiNhan_TraVeLoi()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act - user1 (requester) khong the accept
        var result = await _friendService.AcceptFriendRequestAsync(friendship.Id, _user1Id);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task AcceptFriendRequestAsync_LoiMoiKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _friendService.AcceptFriendRequestAsync(999, _user1Id);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task AcceptFriendRequestAsync_LoiMoiDaXuLy_TraVeLoi()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.AcceptFriendRequestAsync(friendship.Id, _user2Id);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region RejectFriendRequest Tests

    [Fact]
    public async Task RejectFriendRequestAsync_VoiLoiMoiHopLe_TraVeTrue()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.RejectFriendRequestAsync(friendship.Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);

        var updated = await _context.Friendships.FindAsync(friendship.Id);
        Assert.Equal(FriendshipStatus.Rejected, updated!.Status);
    }

    [Fact]
    public async Task RejectFriendRequestAsync_KhongPhaiNguoiNhan_TraVeLoi()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.RejectFriendRequestAsync(friendship.Id, _user3Id);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region CancelFriendRequest Tests

    [Fact]
    public async Task CancelFriendRequestAsync_VoiLoiMoiHopLe_TraVeTrue()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.CancelFriendRequestAsync(friendship.Id, _user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task CancelFriendRequestAsync_KhongPhaiNguoiGui_TraVeLoi()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act - user2 khong the cancel loi moi cua user1
        var result = await _friendService.CancelFriendRequestAsync(friendship.Id, _user2Id);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task CancelFriendRequestAsync_LoiMoiDaDuocChapNhan_TraVeLoi()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.CancelFriendRequestAsync(friendship.Id, _user1Id);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region Unfriend Tests

    [Fact]
    public async Task UnfriendAsync_VoiBanBeHopLe_TraVeTrue()
    {
        // Arrange
        var friendship = new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.UnfriendAsync(_user1Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.True(result.Data);
    }

    [Fact]
    public async Task UnfriendAsync_ChuaLaBanBe_TraVeLoi()
    {
        // Act
        var result = await _friendService.UnfriendAsync(_user1Id, _user2Id);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task UnfriendAsync_VoiNguoiDungKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _friendService.UnfriendAsync(_user1Id, "nonexistent");

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region GetFriends Tests

    [Fact]
    public async Task GetFriendsAsync_VoiDanhSachBanBe_TraVeDanhSach()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user3Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.GetFriendsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(2, result.Data.Count);
    }

    [Fact]
    public async Task GetFriendsAsync_KhongCoBanBe_TraVeDanhSachRong()
    {
        // Act
        var result = await _friendService.GetFriendsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Empty(result.Data);
    }

    #endregion

    #region GetPendingRequests Tests

    [Fact]
    public async Task GetPendingRequestsAsync_VoiLoiMoi_TraVeDanhSach()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user2Id,
            AddresseeId = _user1Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.GetPendingRequestsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data);
    }

    [Fact]
    public async Task GetPendingRequestsAsync_KhongCoLoiMoi_TraVeDanhSachRong()
    {
        // Act
        var result = await _friendService.GetPendingRequestsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Empty(result.Data);
    }

    #endregion

    #region GetSentRequests Tests

    [Fact]
    public async Task GetSentRequestsAsync_VoiLoiMoiDaGui_TraVeDanhSach()
    {
        // Arrange
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user2Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.GetSentRequestsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data);
    }

    [Fact]
    public async Task GetSentRequestsAsync_KhongCoLoiMoi_TraVeDanhSachRong()
    {
        // Act
        var result = await _friendService.GetSentRequestsAsync(_user1Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Empty(result.Data);
    }

    #endregion

    #region GetMutualFriends Tests

    [Fact]
    public async Task GetMutualFriendsAsync_VoiBanChung_TraVeDanhSach()
    {
        // Arrange
        // user1 va user3 la ban
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user1Id,
            AddresseeId = _user3Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        // user2 va user3 la ban
        _context.Friendships.Add(new Friendship
        {
            RequesterId = _user2Id,
            AddresseeId = _user3Id,
            Status = FriendshipStatus.Accepted,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _friendService.GetMutualFriendsAsync(_user1Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data); // user3 la ban chung
    }

    [Fact]
    public async Task GetMutualFriendsAsync_KhongCoBanChung_TraVeDanhSachRong()
    {
        // Act
        var result = await _friendService.GetMutualFriendsAsync(_user1Id, _user2Id);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Empty(result.Data);
    }

    #endregion
}
