using System.Security.Claims;

namespace API.Extensions;

/// <summary>
/// Extension methods cho ClaimsPrincipal
/// Giup lay thong tin user tu JWT token de hon
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Lay User ID tu claims
    /// </summary>
    public static string? GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    /// <summary>
    /// Lay Username tu claims
    /// </summary>
    public static string? GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Name)?.Value;
    }

    /// <summary>
    /// Lay Email tu claims
    /// </summary>
    public static string? GetEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Email)?.Value;
    }

    /// <summary>
    /// Lay Role tu claims
    /// </summary>
    public static string? GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value;
    }

    /// <summary>
    /// Kiem tra user co role Admin khong
    /// </summary>
    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.IsInRole("Admin");
    }

    /// <summary>
    /// Lay tat ca claims cua user
    /// </summary>
    public static Dictionary<string, string> GetAllClaims(this ClaimsPrincipal user)
    {
        return user.Claims.ToDictionary(c => c.Type, c => c.Value);
    }
}
