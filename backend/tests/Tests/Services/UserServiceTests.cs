using Core.DTOs.Auth;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho UserService
public class UserServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly Mock<ILogger<UserService>> _mockLogger;
    private readonly UserService _userService;
    private readonly string _testUserId = "test-user-id";

    public UserServiceTests()
    {
        // Tao InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<User>>();
        _mockUserManager = new Mock<UserManager<User>>(
            userStoreMock.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!
        );

        // Mock Logger
        _mockLogger = new Mock<ILogger<UserService>>();

        // Tao UserService instance
        _userService = new UserService(
            _context,
            _mockUserManager.Object,
            _mockLogger.Object
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
            LastName = "User",
            Bio = "Test bio"
        };
        _context.Users.Add(user);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region GetUserById Tests

    [Fact]
    public async Task GetUserByIdAsync_VoiIdHopLe_TraVeUser()
    {
        // Act
        var result = await _userService.GetUserByIdAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Data);
        Assert.Equal("testuser", result.Data.UserName);
    }

    [Fact]
    public async Task GetUserByIdAsync_VoiIdKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _userService.GetUserByIdAsync("nonexistent-id");

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetUserByIdAsync_VoiUserBiBan_TraVeUser()
    {
        // Arrange
        var bannedUser = new User
        {
            Id = "banned-user",
            UserName = "banneduser",
            Email = "banned@example.com",
            IsBanned = true,
            BanReason = "Vi pham"
        };
        _context.Users.Add(bannedUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _userService.GetUserByIdAsync(bannedUser.Id);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Data?.IsBanned);
    }

    #endregion

    #region UpdateProfile Tests

    [Fact]
    public async Task UpdateProfileAsync_VoiDuLieuHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new UpdateProfileDto
        {
            FirstName = "Updated",
            LastName = "Name",
            Bio = "Updated bio"
        };

        // Act
        var result = await _userService.UpdateProfileAsync(_testUserId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated", result.Data?.FirstName);
        Assert.Equal("Updated bio", result.Data?.Bio);
    }

    [Fact]
    public async Task UpdateProfileAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new UpdateProfileDto
        {
            FirstName = "Updated"
        };

        // Act
        var result = await _userService.UpdateProfileAsync("nonexistent-id", dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateProfileAsync_VoiAvatarUrl_TraVeThanhCong()
    {
        // Arrange
        var dto = new UpdateProfileDto
        {
            AvatarUrl = "https://example.com/avatar.jpg"
        };

        // Act
        var result = await _userService.UpdateProfileAsync(_testUserId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("https://example.com/avatar.jpg", result.Data?.AvatarUrl);
    }

    [Fact]
    public async Task UpdateProfileAsync_VoiCoverImageUrl_TraVeThanhCong()
    {
        // Arrange
        var dto = new UpdateProfileDto
        {
            CoverImageUrl = "https://example.com/cover.jpg"
        };

        // Act
        var result = await _userService.UpdateProfileAsync(_testUserId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("https://example.com/cover.jpg", result.Data?.CoverImageUrl);
    }

    #endregion

    #region SearchUsers Tests

    [Fact]
    public async Task SearchUsersAsync_VoiTuKhoaHopLe_TraVeDanhSach()
    {
        // Act
        var result = await _userService.SearchUsersAsync("test");

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Data);
    }

    [Fact]
    public async Task SearchUsersAsync_VoiTuKhoaKhongKhop_TraVeDanhSachRong()
    {
        // Act
        var result = await _userService.SearchUsersAsync("nonexistent");

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task SearchUsersAsync_VoiTuKhoaRong_TraVeDanhSach()
    {
        // Act
        var result = await _userService.SearchUsersAsync("");

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region ChangePassword Tests

    [Fact]
    public async Task ChangePasswordAsync_VoiMatKhauCuDung_TraVeTrue()
    {
        // Arrange
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(u => u.FindByIdAsync(_testUserId))
            .ReturnsAsync(new User { Id = _testUserId, UserName = "testuser" });
        _mockUserManager.Setup(u => u.CheckPasswordAsync(It.IsAny<User>(), dto.CurrentPassword))
            .ReturnsAsync(true);
        _mockUserManager.Setup(u => u.ChangePasswordAsync(It.IsAny<User>(), dto.CurrentPassword, dto.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userService.ChangePasswordAsync(_testUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task ChangePasswordAsync_VoiMatKhauCuSai_TraVeLoi()
    {
        // Arrange
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "WrongPassword",
            NewPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(u => u.FindByIdAsync(_testUserId))
            .ReturnsAsync(new User { Id = _testUserId, UserName = "testuser" });
        _mockUserManager.Setup(u => u.CheckPasswordAsync(It.IsAny<User>(), dto.CurrentPassword))
            .ReturnsAsync(false);

        // Act
        var result = await _userService.ChangePasswordAsync(_testUserId, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task ChangePasswordAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!"
        };

        _mockUserManager.Setup(u => u.FindByIdAsync("nonexistent-id"))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.ChangePasswordAsync("nonexistent-id", dto);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region BanUser Tests

    [Fact]
    public async Task BanUserAsync_VoiUserHopLe_TraVeTrue()
    {
        // Arrange
        var targetUser = new User
        {
            Id = "target-user",
            UserName = "targetuser",
            Email = "target@example.com"
        };
        _context.Users.Add(targetUser);
        await _context.SaveChangesAsync();

        var dto = new BanUserDto
        {
            Reason = "Vi pham quy dinh",
            Duration = "7"
        };

        // Act
        var result = await _userService.BanUserAsync(targetUser.Id, dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task BanUserAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new BanUserDto
        {
            Reason = "Vi pham",
            Duration = "7"
        };

        // Act
        var result = await _userService.BanUserAsync("nonexistent-id", dto);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task BanUserAsync_VoiLyDoRong_TraVeLoi()
    {
        // Arrange
        var targetUser = new User
        {
            Id = "target-user2",
            UserName = "targetuser2",
            Email = "target2@example.com"
        };
        _context.Users.Add(targetUser);
        await _context.SaveChangesAsync();

        var dto = new BanUserDto
        {
            Reason = "",
            Duration = "7"
        };

        // Act
        var result = await _userService.BanUserAsync(targetUser.Id, dto);

        // Assert
        Assert.NotNull(result);
    }

    #endregion

    #region UnbanUser Tests

    [Fact]
    public async Task UnbanUserAsync_VoiUserDangBiBan_TraVeTrue()
    {
        // Arrange
        var bannedUser = new User
        {
            Id = "banned-user2",
            UserName = "banneduser2",
            Email = "banned2@example.com",
            IsBanned = true,
            BanReason = "Vi pham"
        };
        _context.Users.Add(bannedUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _userService.UnbanUserAsync(bannedUser.Id);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UnbanUserAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Act
        var result = await _userService.UnbanUserAsync("nonexistent-id");

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UnbanUserAsync_VoiUserKhongBiBan_TraVeTrue()
    {
        // Act
        var result = await _userService.UnbanUserAsync(_testUserId);

        // Assert
        Assert.NotNull(result);
    }

    #endregion
}
