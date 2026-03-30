using Core.DTOs.Auth;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize] // Tạm thời tắt để test
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult> GetUser(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        // Tạm thời dùng userId từ seeded data để test
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _userService.UpdateProfileAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpGet("search")]
    public async Task<ActionResult> SearchUsers([FromQuery] string term)
    {
        var result = await _userService.SearchUsersAsync(term);
        return Ok(result);
    }
    
    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        // Tạm thời dùng userId từ seeded data để test
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _userService.ChangePasswordAsync(userId, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
