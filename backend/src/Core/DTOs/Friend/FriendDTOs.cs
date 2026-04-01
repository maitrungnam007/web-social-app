using Core.Enums;

namespace Core.DTOs.Friend;

public class FriendRequestDto
{
    public string AddresseeId { get; set; } = string.Empty;
}

public class FriendshipResponseDto
{
    public int Id { get; set; }
    public string RequesterId { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterAvatar { get; set; }
    public string AddresseeId { get; set; } = string.Empty;
    public string AddresseeName { get; set; } = string.Empty;
    public string? AddresseeAvatar { get; set; }
    public FriendshipStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FriendListDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public FriendshipStatus Status { get; set; }
    public int MutualFriendsCount { get; set; }
}

public class MutualFriendDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
}

public class FriendSuggestionDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public int MutualFriendsCount { get; set; }
}
