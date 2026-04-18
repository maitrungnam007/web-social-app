using System.Collections.Concurrent;

namespace API.Middleware;

/// <summary>
/// Middleware gioi han so request moi IP
/// Chong spam va brute force attack
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    
    // Luu tru so request moi IP
    private static readonly ConcurrentDictionary<string, RateLimitEntry> _entries = new();
    
    // Cau hinh
    private const int MaxRequests = 100;          // Toi da 100 requests
    private static readonly TimeSpan TimeWindow = TimeSpan.FromMinutes(1); // Trong 1 phut

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var now = DateTime.UtcNow;

        // Lay hoac tao entry cho IP
        var entry = _entries.GetOrAdd(ip, _ => new RateLimitEntry
        {
            Count = 0,
            ResetAt = now.Add(TimeWindow)
        });

        // Reset neu da qua thoi gian
        if (now > entry.ResetAt)
        {
            entry.Count = 0;
            entry.ResetAt = now.Add(TimeWindow);
        }

        // Tang so dem
        entry.Count++;

        // Kiem tra gioi han
        if (entry.Count > MaxRequests)
        {
            _logger.LogWarning("Rate limit exceeded for IP: {IP}", ip);

            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json";

            var retryAfter = (int)(entry.ResetAt - now).TotalSeconds;

            context.Response.Headers["Retry-After"] = retryAfter.ToString();
            context.Response.Headers["X-RateLimit-Limit"] = MaxRequests.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = "0";
            context.Response.Headers["X-RateLimit-Reset"] = ((DateTimeOffset)entry.ResetAt).ToUnixTimeSeconds().ToString();

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Qua nhieu request. Vui long thu lai sau.",
                retryAfterSeconds = retryAfter
            });

            return;
        }

        // Them headers thong tin rate limit
        context.Response.Headers["X-RateLimit-Limit"] = MaxRequests.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = (MaxRequests - entry.Count).ToString();
        context.Response.Headers["X-RateLimit-Reset"] = ((DateTimeOffset)entry.ResetAt).ToUnixTimeSeconds().ToString();

        await _next(context);
    }

    // Don cach entry cu moi 5 phut
    static RateLimitingMiddleware()
    {
        Task.Run(async () =>
        {
            while (true)
            {
                await Task.Delay(TimeSpan.FromMinutes(5));
                
                var now = DateTime.UtcNow;
                var expiredKeys = _entries
                    .Where(kvp => now > kvp.Value.ResetAt)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var key in expiredKeys)
                {
                    _entries.TryRemove(key, out _);
                }
            }
        });
    }

    private class RateLimitEntry
    {
        public int Count { get; set; }
        public DateTime ResetAt { get; set; }
    }
}

// Extension method de dang ky middleware
public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>();
    }
}
