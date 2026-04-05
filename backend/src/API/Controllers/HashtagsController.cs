using Core.DTOs.Hashtag;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HashtagsController : ControllerBase
{
    private readonly IHashtagService _hashtagService;

    public HashtagsController(IHashtagService hashtagService)
    {
        _hashtagService = hashtagService;
    }

    // Lấy trending hashtags
    [HttpGet("trending")]
    public async Task<ActionResult> GetTrending([FromQuery] int count = 10)
    {
        var result = await _hashtagService.GetTrendingHashtagsAsync(count);
        return Ok(result);
    }

    // Tìm kiếm hashtag
    [HttpGet("search")]
    public async Task<ActionResult> Search([FromQuery] string term)
    {
        var result = await _hashtagService.SearchHashtagsAsync(term);
        return Ok(result);
    }

    // Lấy hashtag theo tên
    [HttpGet("{name}")]
    public async Task<ActionResult> GetByName(string name)
    {
        var result = await _hashtagService.GetHashtagByNameAsync(name);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}
