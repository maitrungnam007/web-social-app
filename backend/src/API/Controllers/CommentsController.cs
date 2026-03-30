using Core.DTOs.Common;
using Core.DTOs.Comment;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    
    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }
    
    [HttpGet("post/{postId}")]
    public async Task<ActionResult<ApiResponse<List<CommentResponseDto>>>> GetCommentsByPost(int postId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var result = await _commentService.GetCommentsByPostIdAsync(postId, userId);
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CommentResponseDto>>> CreateComment([FromBody] CreateCommentDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _commentService.CreateCommentAsync(dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CommentResponseDto>>> UpdateComment(int id, [FromBody] UpdateCommentDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _commentService.UpdateCommentAsync(id, dto, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteComment(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _commentService.DeleteCommentAsync(id, userId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
    
    [HttpPost("{id}/like")]
    public async Task<ActionResult<ApiResponse<bool>>> LikeComment(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _commentService.LikeCommentAsync(id, userId);
        return Ok(result);
    }
    
    [HttpDelete("{id}/like")]
    public async Task<ActionResult<ApiResponse<bool>>> UnlikeComment(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _commentService.UnlikeCommentAsync(id, userId);
        return Ok(result);
    }
}
