using Core.DTOs.Common;
using Core.DTOs.Friend;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize] // Tạm thời tắt để test
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
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.GetFriendsAsync(userId);
        return Ok(result);
    }
    
    [HttpGet("requests")]
    public async Task<ActionResult<ApiResponse<List<FriendshipResponseDto>>>> GetPendingRequests()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.GetPendingRequestsAsync(userId);
        return Ok(result);
    }
    
    [HttpPost("request")]
    public async Task<ActionResult<ApiResponse<bool>>> SendFriendRequest([FromBody] FriendRequestDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.SendFriendRequestAsync(userId, dto.AddresseeId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("accept/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<bool>>> AcceptFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.AcceptFriendRequestAsync(friendshipId, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("reject/{friendshipId}")]
    public async Task<ActionResult<ApiResponse<bool>>> RejectFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.RejectFriendRequestAsync(friendshipId, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{friendId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Unfriend(string friendId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _friendService.UnfriendAsync(userId, friendId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}
