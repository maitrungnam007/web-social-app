using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Hubs;

// SignalR Hub cho thông báo thời gian thực
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    // User kết nối đến hub
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            // Thêm user vào group riêng
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} connected to NotificationHub", userId);
        }
        await base.OnConnectedAsync();
    }

    // User ngắt kết nối
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} disconnected from NotificationHub", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    // Join một group cụ thể (ví dụ: group chat, group bạn bè)
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    // Rời khỏi group
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
}
