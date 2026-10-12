using System.Text;
using System.Text.Json;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.UserAccount;

public record ChangePasswordCommand(string NewPassword, string Password) : IRequest<OperationResult<Unit>>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenService;
    //private readonly ActionLogService _actionLogService;
    private ISession? _session => _httpContextAccessor.HttpContext?.Session;

    public ChangePasswordCommandHandler(ApplicationDbContext context, PasswordService password, IHttpContextAccessor httpContextAccessor, TokenHandlerService tokenService)
    {
        _context = context;
        _passwordService = password;
        _httpContextAccessor = httpContextAccessor;
        _tokenService = tokenService;
        // _actionLogService = actionLogService;
    }

    public async Task<OperationResult<Unit>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();
        var userName = GetCurrentUserName();

        if (string.IsNullOrEmpty(userName))
        {
            userName = _session?.GetString("user") ?? string.Empty;
        }

        long userId = 0;
        User? userAccount = null;

        if (!string.IsNullOrEmpty(userName))
        {
            userAccount = await _context.Users
                      .FirstOrDefaultAsync(x => x.Username == userName, cancellationToken);

            if (userAccount != null)
            {
                userId = userAccount.Id;
            }
        }

        if (userAccount is null)
        {
            result.AddError(ErrorCode.NotFound, "Account Does not Exist");
            return result;
        }

        if (!_passwordService.ValidatePassword(userAccount.Password, request.Password))
        {
            result.AddError(ErrorCode.IncorrectPassword, "Invalide password.");
            return result;
        }

        userAccount.UpdatePassword(_passwordService.HashPassword(request.NewPassword));

        _context.Users.Update(userAccount);
        await _context.SaveChangesAsync(cancellationToken);

        result.Message = "Operation success";
        var options = new JsonSerializerOptions
        {
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve,
            WriteIndented = true
        };

        //await _actionLogService.LogActionAsync(
        //    userId,
        //    JsonSerializer.Serialize(request, options),
        //    JsonSerializer.Serialize(result, options),
        //    "ChangePassword"
        //);
        return result;
    }

    // Helper method to get the currently logged-in UserName
    private string? GetCurrentUserName()
    {
        var authorizationHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
            return null; // No token available in request
        }

        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        var claims = _tokenService.GetClaims(token); // Use TokenHandlerService to get claims

        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value; // Return the username or null if not found
    }
}
