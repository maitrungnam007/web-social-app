using System.Diagnostics;

namespace API.Middleware;

/// <summary>
/// Middleware ghi log requests va responses
/// Giup theo doi performance va debug
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;

        // Thong tin request
        var requestMethod = request.Method;
        var requestPath = request.Path;
        var requestQuery = request.QueryString;
        var userIp = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        _logger.LogInformation(
            "Request: {Method} {Path}{Query} from {IP}",
            requestMethod, requestPath, requestQuery, userIp);

        // Goi middleware tiep theo
        await _next(context);

        // Tinh thoi gian xu ly
        stopwatch.Stop();

        var statusCode = context.Response.StatusCode;

        // Log response voi level phu hop
        if (statusCode >= 400)
        {
            _logger.LogWarning(
                "Response: {StatusCode} - {Method} {Path} - {ElapsedMs}ms",
                statusCode, requestMethod, requestPath, stopwatch.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogInformation(
                "Response: {StatusCode} - {Method} {Path} - {ElapsedMs}ms",
                statusCode, requestMethod, requestPath, stopwatch.ElapsedMilliseconds);
        }

        // Canh bao neu request xu ly qua lau (> 1 giay)
        if (stopwatch.ElapsedMilliseconds > 1000)
        {
            _logger.LogWarning(
                "Slow Request: {Method} {Path} took {ElapsedMs}ms",
                requestMethod, requestPath, stopwatch.ElapsedMilliseconds);
        }
    }
}

// Extension method de dang ky middleware
public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
