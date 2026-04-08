using Core.DTOs;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingService _systemSettingService;

    public SystemSettingsController(ISystemSettingService systemSettingService)
    {
        _systemSettingService = systemSettingService;
    }

    // Lay c?u hinh h? th?ng
    [HttpGet("config")]
    public async Task<ActionResult> GetConfig()
    {
        var result = await _systemSettingService.GetConfigAsync();
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // C?p nh?t c?u hinh
    [HttpPut("config")]
    public async Task<ActionResult> UpdateConfig([FromBody] UpdateSystemSettingDto dto)
    {
        var result = await _systemSettingService.UpdateSettingAsync(dto.Key, dto.Value);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Lay tat ca c?u hinh
    [HttpGet]
    public async Task<ActionResult> GetAllSettings()
    {
        var result = await _systemSettingService.GetAllSettingsAsync();
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Lay danh sch t? kh?a c?m
    [HttpGet("badwords")]
    public async Task<ActionResult> GetBadWords([FromQuery] string? category)
    {
        var result = await _systemSettingService.GetBadWordsAsync(category);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Thm t? kh?a c?m
    [HttpPost("badwords")]
    public async Task<ActionResult> AddBadWord([FromBody] CreateBadWordDto dto)
    {
        var result = await _systemSettingService.AddBadWordAsync(dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // Xa t? kh?a c?m
    [HttpDelete("badwords/{id}")]
    public async Task<ActionResult> DeleteBadWord(int id)
    {
        var result = await _systemSettingService.DeleteBadWordAsync(id);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // B?t/t?t t? kh?a c?m
    [HttpPatch("badwords/{id}/toggle")]
    public async Task<ActionResult> ToggleBadWord(int id)
    {
        var result = await _systemSettingService.ToggleBadWordAsync(id);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
