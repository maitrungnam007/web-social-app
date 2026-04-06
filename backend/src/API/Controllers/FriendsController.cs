using Core.DTOs.Common;
using Core.DTOs.Friend;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly IFriendService _friendService;
    
    public FriendsController(IFriendService friendService)
    {
        _friendService = friendService;
    }
    
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<FriendListDto>>>> GetFriends()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.GetFriendsAsync(userId);
        return Ok(result);
    }
    
    [HttpGet("requests")]
    public async Task<ActionResult<ApiResponse<List<FriendshipResponseDto>>>> GetPendingRequests()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.GetPendingRequestsAsync(userId);
        return Ok(result);
    }
    
    [HttpGet("sent-requests")]
    public async Task<ActionResult<ApiResponse<List<FriendshipResponseDto>>>> GetSentRequests()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.GetSentRequestsAsync(userId);
        return Ok(result);
    }
    
    [HttpPost("request")]
    public async Task<ActionResult<ApiResponse<bool>>> SendFriendRequest([FromBody] FriendRequestDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.SendFriendRequestAsync(userId, dto.AddresseeId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("cancel/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.CancelFriendRequestAsync(friendshipId, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("accept/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<bool>>> AcceptFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.AcceptFriendRequestAsync(friendshipId, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("reject/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<bool>>> RejectFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.RejectFriendRequestAsync(friendshipId, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{friendId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Unfriend(string friendId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.UnfriendAsync(userId, friendId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("mutual/{otherUserId}")]
    public async Task<ActionResult<ApiResponse<List<MutualFriendDto>>>> GetMutualFriends(string otherUserId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.GetMutualFriendsAsync(userId, otherUserId);
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<ActionResult<ApiResponse<List<FriendSuggestionDto>>>> GetFriendSuggestions([FromQuery] int count = 10)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.GetFriendSuggestionsAsync(userId, count);
        return Ok(result);
    }

    // Tìm kiếm bạn bè theo username cho mention
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<MentionUserDto>>>> SearchFriendsForMention([FromQuery] string? query = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng" });
        
        var result = await _friendService.SearchFriendsForMentionAsync(userId, query ?? "");
        return Ok(result);
    }
}
