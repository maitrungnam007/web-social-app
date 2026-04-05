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
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.CreateStoryAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteStory(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.DeleteStoryAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost("{id}/view")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsViewed(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.MarkStoryAsViewedAsync(id, userId);
        return Ok(result);
    }
    
    // Story Archive
    [HttpGet("archive")]
    public async Task<ActionResult<ApiResponse<List<ArchivedStoryResponseDto>>>> GetArchivedStories()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.GetArchivedStoriesAsync(userId);
        return Ok(result);
    }
    
    // Story Highlights
    [HttpGet("highlights/{userId}")]
    public async Task<ActionResult<ApiResponse<List<HighlightResponseDto>>>> GetUserHighlights(string userId)
    {
        var result = await _storyService.GetUserHighlightsAsync(userId);
        return Ok(result);
    }
    
    [HttpPost("highlights")]
    public async Task<ActionResult<ApiResponse<HighlightResponseDto>>> CreateHighlight([FromBody] CreateHighlightDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.CreateHighlightAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPut("highlights/{id}")]
    public async Task<ActionResult<ApiResponse<HighlightResponseDto>>> UpdateHighlight(int id, [FromBody] UpdateHighlightDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.UpdateHighlightAsync(id, dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("highlights/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteHighlight(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.DeleteHighlightAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost("highlights/{id}/stories")]
    public async Task<ActionResult<ApiResponse<bool>>> AddStoryToHighlight(int id, [FromBody] AddStoryToHighlightDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.AddStoryToHighlightAsync(id, dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("highlights/{highlightId}/stories/{storyId}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveStoryFromHighlight(int highlightId, int storyId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "1c4280dd-3453-4a8e-b802-6183ab3753da";
        var result = await _storyService.RemoveStoryFromHighlightAsync(highlightId, storyId, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}
