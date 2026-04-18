using System.Net;
using System.Text.Json;
using Core.DTOs.Common;

namespace API.Middleware;

/// <summary>
/// Middleware xu ly exception toan cuc
/// Bat tat ca exceptions va tra ve JSON response chuan
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "Loi xay ra: {Message}", exception.Message);

        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = exception switch
        {
            // Loi khong tim thay (404)
            KeyNotFoundException => new ApiResponse<object>
            {
                Success = false,
                Message = "Khong tim thay tai nguyen",
                Errors = new List<string> { exception.Message }
            },

            // Loi khong du quyen (403)
            UnauthorizedAccessException => new ApiResponse<object>
            {
                Success = false,
                Message = "Ban khong co quyen thuc hien hanh dong nay",
                Errors = new List<string> { exception.Message }
            },

            // Loi validation (400)
            ArgumentException or ArgumentNullException => new ApiResponse<object>
            {
                Success = false,
                Message = "Du lieu khong hop le",
                Errors = new List<string> { exception.Message }
            },

            // Loi server (500)
            _ => new ApiResponse<object>
            {
                Success = false,
                Message = "Co loi xay ra tren server",
                Errors = new List<string> { "Vui long thu lai sau" }
            }
        };

        response.StatusCode = exception switch
        {
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
            ArgumentException or ArgumentNullException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(json);
    }
}

// Extension method de dang ky middleware
public static class ErrorHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
