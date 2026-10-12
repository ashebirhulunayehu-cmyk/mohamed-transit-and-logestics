using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using MohamedTransit.Domain.Data;

namespace MohamedTransit.API.Helpers;

public static class JwtHelper
{
    public static long? GetCurrentUserId(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
    {
        var authorizationHeader = httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return null;

        // ቶከኑን ከባዶ ቦታዎች (Whitespace) እና ከትርፍ ፊደላት እናጸዳዋለን
        var token = authorizationHeader.Replace("Bearer ", "").Trim();

        try
        {
            var handler = new JwtSecurityTokenHandler();

            // ቶከኑ ትክክለኛ ቅርጸት ያለው መሆኑን አስቀድመን እንፈትሻለን
            if (!handler.CanReadToken(token))
                return null;

            var jsonToken = handler.ReadJwtToken(token);

            // 1. "id" ወይም መደበኛ የ NameIdentifier / sub ክሌሞችን እንፈትሻለን
            var idClaim = jsonToken.Claims.FirstOrDefault(x =>
                x.Type == "id" ||
                x.Type == ClaimTypes.NameIdentifier ||
                x.Type == JwtRegisteredClaimNames.Sub);

            if (idClaim != null && long.TryParse(idClaim.Value, out var userId))
                return userId;

            // 2. "userName" ወይም መደበኛ የ Name / UniqueName ክሌሞችን እንፈትሻለን
            var userNameClaim = jsonToken.Claims.FirstOrDefault(x =>
                x.Type == "userName" ||
                x.Type == ClaimTypes.Name ||
                x.Type == JwtRegisteredClaimNames.UniqueName);

            if (userNameClaim != null)
            {
                var user = context.Users.FirstOrDefault(u => u.Username == userNameClaim.Value);
                if (user != null)
                    return user.Id;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    public static string? GetCurrentUsername(IHttpContextAccessor httpContextAccessor)
    {
        var authorizationHeader = httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            return null;

        var token = authorizationHeader.Replace("Bearer ", "").Trim();

        try
        {
            var handler = new JwtSecurityTokenHandler();

            if (!handler.CanReadToken(token))
                return null;

            var jsonToken = handler.ReadJwtToken(token);

            return jsonToken.Claims.FirstOrDefault(x =>
                x.Type == "userName" ||
                x.Type == ClaimTypes.Name ||
                x.Type == JwtRegisteredClaimNames.UniqueName)?.Value;
        }
        catch
        {
            return null;
        }
    }
}
