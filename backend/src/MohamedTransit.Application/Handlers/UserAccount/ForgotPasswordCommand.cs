using Mapster;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Application.Services;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

// 1. Command Definition (በስክሪንሹቱ መሰረት 3ቱንም properties እንደ optional በመያዝ)
public record ForgotPasswordCommand(
    string? NewPassword = null,
    string? Password = null,
    string? UserName = null
) : IRequest<OperationResult<Unit>>;

// 2. Command Handler
public class ForgotPasswordCommandHandler
    : IRequestHandler<ForgotPasswordCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly EmailSenderService _emailSenderService;
    private readonly TokenHandlerService _tokenHandlerService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ForgotPasswordCommandHandler(
        ApplicationDbContext context,
        TokenHandlerService tokenHandlerService,
        EmailSenderService emailSenderService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _emailSenderService = emailSenderService;
        _tokenHandlerService = tokenHandlerService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<Unit>> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        try
        {
            // UserName ከተላከው JSON ውስጥ አለመኖሩን ወይም ባዶ መሆኑን ማረጋገጥ
            if (string.IsNullOrWhiteSpace(request.UserName))
            {
                result.AddError(
                    ErrorCode.NotFound,
                    "Account Does not Exist");

                return result;
            }

            var userAccount = await _context.Users
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(
                    x => x.Username.ToLower() == request.UserName.ToLower(),
                    cancellationToken);

            if (userAccount is null)
            {
                result.AddError(
                    ErrorCode.NotFound,
                    "Account Does not Exist");

                return result;
            }

            var email = userAccount.Email;

            if (string.IsNullOrWhiteSpace(email))
            {
                result.AddError(
                    ErrorCode.NotFound,
                    "No email address is associated with this account.");

                return result;
            }

            var roles = await GetRolesAsync(
                userAccount,
                cancellationToken);

            string token = _tokenHandlerService.GetJwtString(
                30,
                _tokenHandlerService.GetClaimFromRole(
                    roles,
                    userAccount.Username,
                    userAccount.Id));

            if (string.IsNullOrEmpty(token))
            {
                result.AddError(
                    ErrorCode.IncorrectPassword,
                    "Invalid Token.");

                return result;
            }

            string callbackUrl =
                "https://www.Client.web/#/reset-password?activation_token="
                + token;

            string message =
                "<p>Please reset your password by clicking " +
                "<a href='" + callbackUrl + "'>here</a></p>";

            await _emailSenderService.SendEmailAsync(
                message,
                "Forgot Password",
                new[] { email },
                null,
                null);

            result.Message =
                "If the User Name is known to us we send the password reset link";

            result.Payload = Unit.Value;

            return result;
        }
        catch (Exception ex)
        {
            result.AddError(
                ErrorCode.ServerError,
                ex.Message);
        }

        return result;
    }

    private async Task<List<RoleDto>> GetRolesAsync(
        User user,
        CancellationToken cancellationToken)
    {
        var result = new List<RoleDto>();

        if (user.UserRoles == null || !user.UserRoles.Any())
            return result;

        var roleIds = user.UserRoles
            .Select(x => x.RoleId)
            .ToList();

        var roles = await _context.Roles
            .Where(x => roleIds.Contains(x.Id))
            .Include(x => x.RolePrivileges)
            .ToListAsync(cancellationToken);

        foreach (var role in roles)
        {
            var roleDto = new RoleDto();

            if (role.RolePrivileges != null)
            {
                var privilegeIds = role.RolePrivileges
                    .Select(x => x.PrivilegeId)
                    .ToList();

                var privileges = await _context.Privileges
                    .Where(x => privilegeIds.Contains(x.Id))
                    .ToListAsync(cancellationToken);

                roleDto.Privileges =
                    privileges.Adapt<List<PrivilegeDto>>();
            }

            result.Add(roleDto);
        }

        return result;
    }
}
