using Core.DTOs.Auth;
using Core.DTOs.Common;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.ErrorResult("Dữ liệu không hợp lệ", errors));
        }
        
        var result = await _authService.RegisterAsync(dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.ErrorResult("Dữ liệu không hợp lệ", errors));
        }
        
        var result = await _authService.LoginAsync(dto);
        if (!result.Success)
            return Unauthorized(result);
        return Ok(result);
    }
    
    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto.Token, dto.RefreshToken);
        if (!result.Success)
            return Unauthorized(result);
        return Ok(result);
    }
}

public class RefreshTokenDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
