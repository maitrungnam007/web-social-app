using Core.DTOs.Auth;
using Core.Entities;
using Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Tests.Services;

// Unit tests cho AuthService
public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
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

        // Mock IConfiguration voi JwtSettings
        _mockConfiguration = new Mock<IConfiguration>();
        var jwtSettingsSection = new Mock<IConfigurationSection>();
        jwtSettingsSection.Setup(s => s["SecretKey"]).Returns("YourSuperSecretKeyThatIsAtLeast32CharactersLong!");
        jwtSettingsSection.Setup(s => s["Issuer"]).Returns("InteractHub");
        jwtSettingsSection.Setup(s => s["Audience"]).Returns("InteractHubClient");
        jwtSettingsSection.Setup(s => s["ExpirationInMinutes"]).Returns("60");
        _mockConfiguration.Setup(c => c.GetSection("JwtSettings")).Returns(jwtSettingsSection.Object);

        // Mock Logger
        _mockLogger = new Mock<ILogger<AuthService>>();

        // Tao AuthService instance
        _authService = new AuthService(
            _mockUserManager.Object,
            _mockConfiguration.Object,
            _mockLogger.Object
        );
    }

    #region Register Tests

    [Fact]
    public async Task RegisterAsync_VoiDuLieuHopLe_TraVeThanhCong()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "testuser",
            Email = "test@example.com",
            Password = "Password123!",
            FirstName = "Test",
            LastName = "User"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), dto.Password))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(u => u.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(u => u.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(dto.UserName, result.Data.User.UserName);
        Assert.NotNull(result.Data.Token);
    }

    [Fact]
    public async Task RegisterAsync_VoiUsernameDaTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "existinguser",
            Email = "test@example.com",
            Password = "Password123!"
        };

        var existingUser = new User { UserName = "existinguser", Email = "existing@example.com" };
        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task RegisterAsync_VoiEmailDaTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "newuser",
            Email = "existing@example.com",
            Password = "Password123!"
        };

        var existingUser = new User { UserName = "existing", Email = "existing@example.com" };
        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Email", result.Message);
    }

    [Fact]
    public async Task RegisterAsync_VoiMatKhauYeu_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "testuser",
            Email = "test@example.com",
            Password = "123"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), dto.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordTooShort",
                Description = "Mat khau qua ngan"
            }));

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task LoginAsync_VoiThongTinHopLe_TraVeToken()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "testuser",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = "user1",
            UserName = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            IsBanned = false
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);
        _mockUserManager.Setup(u => u.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotNull(result.Data.Token);
        Assert.Equal(dto.UserName, result.Data.User.UserName);
    }

    [Fact]
    public async Task LoginAsync_VoiUserKhongTonTai_TraVeLoi()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "nonexistent",
            Password = "Password123!"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task LoginAsync_VoiMatKhauSai_TraVeLoi()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "testuser",
            Password = "WrongPassword"
        };

        var user = new User
        {
            Id = "user1",
            UserName = "testuser",
            Email = "test@example.com",
            IsBanned = false
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task LoginAsync_VoiUserBiBan_TraVeLoi()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "banneduser",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = "user1",
            UserName = "banneduser",
            Email = "banned@example.com",
            IsBanned = true,
            BanReason = "Vi pham quy dinh",
            BanExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    [Fact]
    public async Task LoginAsync_VoiUserBiBanDaHetHan_TraVeToken()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "unbanneduser",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = "user1",
            UserName = "unbanneduser",
            Email = "unbanned@example.com",
            IsBanned = true,
            BanReason = "Test",
            BanExpiresAt = DateTime.UtcNow.AddDays(-1) // Da het han
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);
        _mockUserManager.Setup(u => u.UpdateAsync(It.IsAny<User>()))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(u => u.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
    }

    [Fact]
    public async Task LoginAsync_VoiAdminRole_TraVeTokenVoiAdminRole()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "adminuser",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = "admin1",
            UserName = "adminuser",
            Email = "admin@example.com",
            FirstName = "Admin",
            LastName = "User",
            IsBanned = false
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);
        _mockUserManager.Setup(u => u.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Admin" });

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Admin", result.Data.User.Role);
    }

    [Fact]
    public async Task LoginAsync_VoiUserCoAvatar_TraVeToken()
    {
        // Arrange
        var dto = new LoginDto
        {
            UserName = "userwithavatar",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = "user1",
            UserName = "userwithavatar",
            Email = "avatar@example.com",
            FirstName = "Test",
            LastName = "User",
            IsBanned = false,
            AvatarUrl = "https://example.com/avatar.jpg"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync(user);
        _mockUserManager.Setup(u => u.CheckPasswordAsync(user, dto.Password))
            .ReturnsAsync(true);
        _mockUserManager.Setup(u => u.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotNull(result.Data.User.AvatarUrl);
    }

    [Fact]
    public async Task RegisterAsync_VoiEmailKhongHopLe_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "testuser",
            Email = "invalid-email",
            Password = "Password123!"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), dto.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "InvalidEmail",
                Description = "Email khong hop le"
            }));

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
    }

    [Fact]
    public async Task RegisterAsync_VoiCreateThatBai_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "testuser",
            Email = "test@example.com",
            Password = "Password123!"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), dto.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "CreateFailed",
                Description = "Khong the tao user"
            }));

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
    }

    [Fact]
    public async Task RegisterAsync_VoiAddRoleThatBai_TraVeLoi()
    {
        // Arrange
        var dto = new RegisterDto
        {
            UserName = "testuser",
            Email = "test@example.com",
            Password = "Password123!"
        };

        _mockUserManager.Setup(u => u.FindByNameAsync(dto.UserName))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.FindByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), dto.Password))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(u => u.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "RoleFailed",
                Description = "Khong the gan role"
            }));

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        Assert.False(result.Success);
    }

    #endregion

    #region RefreshToken Tests

    [Fact]
    public async Task RefreshTokenAsync_ChuaTrienKhai_TraVeLoi()
    {
        // Act
        var result = await _authService.RefreshTokenAsync("token", "refreshToken");

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Message);
    }

    #endregion
}
