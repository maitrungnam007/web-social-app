using Core.Enums;

namespace Core.Entities;

public class Friendship
{
    public int Id { get; set; }
    
    public string RequesterId { get; set; } = string.Empty;
    public virtual User Requester { get; set; } = null!;
    
    public string AddresseeId { get; set; } = string.Empty;
    public virtual User Addressee { get; set; } = null!;
    
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
