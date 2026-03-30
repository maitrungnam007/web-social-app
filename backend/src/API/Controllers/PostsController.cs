using Core.DTOs.Common;
using Core.DTOs.Post;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    
    public PostsController(IPostService postService)
    {
        _postService = postService;
    }
    
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PostResponseDto>>>> GetPosts([FromQuery] PostFilterDto filter)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var result = await _postService.GetPostsAsync(filter, userId);
        return Ok(result);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> GetPost(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var result = await _postService.GetPostByIdAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> CreatePost([FromBody] CreatePostDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _postService.CreatePostAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetPost), new { id = result.Data!.Id }, result);
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> UpdatePost(int id, [FromBody] UpdatePostDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _postService.UpdatePostAsync(id, dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePost(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _postService.DeletePostAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost("{id}/like")]
    public async Task<ActionResult<ApiResponse<bool>>> LikePost(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _postService.LikePostAsync(id, userId);
        return Ok(result);
    }
    
    [HttpDelete("{id}/like")]
    public async Task<ActionResult<ApiResponse<bool>>> UnlikePost(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _postService.UnlikePostAsync(id, userId);
        return Ok(result);
    }
}
