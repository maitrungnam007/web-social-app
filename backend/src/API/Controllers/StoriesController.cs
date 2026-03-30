using Core.DTOs.Common;
using Core.DTOs.Story;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;
    
    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }
    
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StoryResponseDto>>>> GetActiveStories()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var result = await _storyService.GetActiveStoriesAsync(userId);
        return Ok(result);
    }
    
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<StoryResponseDto>>>> GetUserStories(string userId)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var result = await _storyService.GetUserStoriesAsync(userId, currentUserId);
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> CreateStory([FromBody] CreateStoryDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _storyService.CreateStoryAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteStory(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _storyService.DeleteStoryAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost("{id}/view")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsViewed(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _storyService.MarkStoryAsViewedAsync(id, userId);
        return Ok(result);
    }
}
