using System.Security.Claims;

using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record RefreshTokenCommand(string RefreshToken) : IRequest<OperationResult<UserLoginDto>>;

internal class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, OperationResult<UserLoginDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly TokenHandlerService _tokenService;

    public RefreshTokenCommandHandler(ApplicationDbContext context, TokenHandlerService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<OperationResult<UserLoginDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<UserLoginDto>();

        try
        {
            var user = await _context.Users
                .Where(x => x.RefreshToken == request.RefreshToken)
                .Include(x => x.UserRoles)
                    .ThenInclude(x => x.Role)
                        .ThenInclude(x => x.RolePrivileges)
                            .ThenInclude(x => x.Privilege)
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                result.AddError(ErrorCode.NotFound, "User doesn't exist.");
                return result;
            }

            if (user.IsAccountLocked)
            {
                result.AddError(ErrorCode.ServerError, "Your account is locked");
                return result;
            }

            if (user.RecordStatus != RecordStatus.Active)
            {
                result.AddError(ErrorCode.NotFound, "User doesn't exist.");
                return result;
            }

            var identityUser = new UserLoginDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Username = user.Username,
                Roles = await GetRolesAsync(user)
            };

            identityUser.AccessToken = GetJwtString(user.UserTokenLifetime, GetClaims(identityUser));
            identityUser.RefreshToken = await SetRefreshTokenAsync(user, cancellationToken);

            result.Payload = identityUser;
            result.Message = "Operation success";
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
            return result;
        }
    }

    private static Task<List<RoleDto>> GetRolesAsync(User user)
    {
        var result = new List<RoleDto>();

        if (user.UserRoles != null && user.UserRoles.Any())
        {
            foreach (var userRole in user.UserRoles)
            {
                if (userRole.Role == null) continue;

                var roleDto = new RoleDto
                {
                    RoleName = userRole.Role.Name,
                    Privileges = new List<PrivilegeDto>()
                };

                if (userRole.Role.RolePrivileges != null)
                {
                    foreach (var roleClaim in userRole.Role.RolePrivileges)
                    {
                        if (roleClaim.Privilege == null) continue;

                        roleDto.Privileges.Add(new PrivilegeDto
                        {
                            Id = roleClaim.Privilege.Id,
                            Action = roleClaim.Privilege.Action
                        });
                    }
                }

                result.Add(roleDto);
            }
        }

        return Task.FromResult(result);
    }

    private static List<Claim> GetClaims(UserLoginDto user)
    {
        var result = new List<Claim>
        {
            new Claim("userName", user.Username),
            new Claim("id", user.Id.ToString())
        };

        if (user.Roles != null)
        {
            foreach (var role in user.Roles)
            {
                if (role.Privileges == null) continue;

                foreach (var clientClaim in role.Privileges)
                {
                    result.Add(new Claim(clientClaim.Id.ToString(), clientClaim.Action));
                }
            }
        }

        return result;
    }

    private string GetJwtString(int tokenLife, List<Claim> claimList)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, claimList.FirstOrDefault(c => c.Type == "id")?.Value ?? string.Empty),
            new Claim(ClaimTypes.Name, claimList.FirstOrDefault(c => c.Type == "userName")?.Value ?? string.Empty)
        }
        .Union(claimList)
        .ToList();

        var token = _tokenService.CreateSecurityToken(claims, tokenLife);
        return _tokenService.WriteToken(token);
    }

    private async Task<string> SetRefreshTokenAsync(User user, CancellationToken cancellationToken)
    {
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        user.UpdateRefreshToken(newRefreshToken, DateTime.UtcNow.AddMinutes(user.UserTokenLifetime));

        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);

        return newRefreshToken;
    }
}
