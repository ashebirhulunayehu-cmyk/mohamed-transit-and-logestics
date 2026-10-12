using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.UserAccount;

internal class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, OperationResult<UserLoginDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly TokenHandlerService _tokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LoginUserCommandHandler(ApplicationDbContext context, PasswordService passwordService,
        TokenHandlerService tokenService, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _tokenService = tokenService;
        _passwordService = passwordService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<UserLoginDto>> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<UserLoginDto>();
        var userName = GetCurrentUserName();
        if (string.IsNullOrEmpty(userName))
        {
            userName = "";
        }

        var identifier = !string.IsNullOrWhiteSpace(request.UserName)
            ? request.UserName.Trim()
            : request.Email.Trim();
        var normalizedIdentifier = identifier.ToLowerInvariant();

        var user = await _context.Users
            .Where(x =>
                (x.Username.ToLower() == normalizedIdentifier || x.Email.ToLower() == normalizedIdentifier) &&
                x.AccountStatus == AccountStatus.Approved)
            .Include(x => x.UserRoles)
                .ThenInclude(x => x.Role)
                    .ThenInclude(x => x.RolePrivileges)
                        .ThenInclude(x => x.Privilege)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return OperationResult<UserLoginDto>.Failure("User doesn't exist.", ErrorCode.UserDoesNotExist);
        }

        if (!_passwordService.ValidatePassword(user.Password, request.Password))
        {
            return OperationResult<UserLoginDto>.Failure("Invalid password.", ErrorCode.IncorrectPassword);
        }

        if (user.IsAccountLocked)
        {
            return OperationResult<UserLoginDto>.Failure("Your account is locked.", ErrorCode.ServerError);
        }

        if (user.RecordStatus != RecordStatus.Active)
        {
            return OperationResult<UserLoginDto>.Failure("User doesn't exist.", ErrorCode.UserDoesNotExist);
        }

        var User = new UserLoginDto(user.Username, user.Email, user.FirstName, user.LastName, user.Phone, user.ProfilePhoto);
        User.Id = user.Id;
        User.Roles = _getRole(user);
        User.AccessToken = GetJwtString(user.UserTokenLifetime, _getClaim(User));
        User.RefreshToken = SetRefreshToken(user);

        result.Payload = User;
        return result;
    }

    private List<RoleDto> _getRole(User user)
    {
        var result = new List<RoleDto>();
        if (user.UserRoles != null && user.UserRoles.Any())
        {
            foreach (var userRole in user.UserRoles)
            {
                var roleDto = new RoleDto();
                roleDto.Id = userRole.Role.Id;
                roleDto.RoleName = userRole.Role.Name;
                if (userRole.Role.RolePrivileges != null)
                {
                    foreach (var roleClaim in userRole.Role.RolePrivileges)
                    {
                        roleDto.Privileges.Add(new PrivilegeDto
                        {
                            Id = roleClaim.PrivilegeId,
                            Action = roleClaim.Privilege?.Action ?? ""
                        });
                    }
                }
                result.Add(roleDto);
            }
        }
        return result;
    }

    private List<Claim> _getClaim(UserLoginDto user)
    {
        var result = new List<Claim>();
        result.Add(new Claim("userName", user.Username));
        result.Add(new Claim("id", user.Id.ToString()));
        if (user.Roles != null)
        {
            foreach (var role in user.Roles)
            {
                if (role.Privileges != null)
                {
                    foreach (var userPrivilege in role.Privileges)
                    {
                        Claim claim = new Claim(userPrivilege.Id.ToString(), string.Format("{0}", userPrivilege.Action));
                        result.Add(claim);
                    }
                }
            }
        }
        return result;
    }

    private string GetJwtString(int tokenLife, List<Claim> claimList)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        }
        .Union(claimList).ToList();
        var token = _tokenService.CreateSecurityToken(claims, tokenLife);
        return _tokenService.WriteToken(token);
    }

    public string SetRefreshToken(User user)
    {
        user.RefreshTokenExpireDate = DateTime.UtcNow.AddMinutes(user.UserTokenLifetime);
        user.RefreshToken = _tokenService.GenerateRefreshToken() ?? "";
        _context.Users.Update(user);
        _context.SaveChanges();
        return user.RefreshToken;
    }

    private string? GetCurrentUserName()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
            return null;
        }

        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        var claims = _tokenService.GetClaims(token);

        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value;
    }
}
