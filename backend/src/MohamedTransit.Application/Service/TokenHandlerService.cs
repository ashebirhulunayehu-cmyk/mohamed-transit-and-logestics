using MohamedTransit.Application.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MohamedTransit.Application.DTO;

namespace MohamedTransit.Application.Service;

public class TokenHandlerService
{
    private readonly JwtSettings _jwtSettings;
    private readonly byte[] _key;

    public TokenHandlerService(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
        _key = Encoding.UTF8.GetBytes(_jwtSettings.SigningKey);
    }

    public JwtSecurityTokenHandler TokenHandler = new();

    public SecurityToken CreateSecurityToken(List<Claim> claims, int accessTokenLifetime)
    {
        return GetTokenDescriptor(claims, accessTokenLifetime);
    }

    public string WriteToken(SecurityToken token)
    {
        return TokenHandler.WriteToken(token);
    }

    public bool ValidateToken(string claim, List<Claim> claims) =>
        claims.Any(x => string.Equals(x.Value, claim, StringComparison.OrdinalIgnoreCase));

    public bool ValidateToken(string token)
    {
        var validations = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(_key),
            ValidateIssuer = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = "MohamedTransitApp",
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            TokenHandler.ValidateToken(token, validations, out SecurityToken securityToken);
            return securityToken.ValidTo > DateTime.UtcNow;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public List<Claim> GetClaims(string token)
    {
        try
        {
            var securityToken = TokenHandler.ReadJwtToken(token);
            return securityToken.Claims.ToList();
        }
        catch (Exception)
        {
            return new List<Claim>();
        }
    }

    private JwtSecurityToken GetTokenDescriptor(List<Claim> claims, int accessTokenLifetime)
    {
        var symmetricSecurityKey = new SymmetricSecurityKey(_key);
        var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

        return new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: "MohamedTransitApp",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(accessTokenLifetime),
            signingCredentials: signingCredentials
        );
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public List<Claim> GetClaimFromRole(List<RoleDto> roles, string username, long userId)
    {
        var result = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username)
        };

        foreach (var role in roles)
        {
            if (role.Privileges != null)
            {
                foreach (var userPrivilege in role.Privileges)
                {
                    // string የነበረውን የ Claim Key "Privilege" በሚል የ Claim አይነት መተካት
                    result.Add(new Claim("Privilege", userPrivilege.Action ?? string.Empty));
                }
            }
        }

        return result;
    }

    public string GetJwtString(int tokenLife, List<Claim> claimList)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(claimList);

        var token = CreateSecurityToken(claims, tokenLife);
        return WriteToken(token);
    }
}
