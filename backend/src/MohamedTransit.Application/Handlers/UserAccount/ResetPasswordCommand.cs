using System.Text.Json;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record ResetPasswordCommand(string UserName, string Password) : IRequest<OperationResult<Unit>>;

internal class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly TokenHandlerService _tokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ResetPasswordCommandHandler(
        ApplicationDbContext context,
        PasswordService passwordService,
        TokenHandlerService tokenService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _tokenService = tokenService;
        _httpContextAccessor = httpContextAccessor;
        _passwordService = passwordService;
    }

    public async Task<OperationResult<Unit>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();
        var userName = GetCurrentUserName();

        long userId = 0;
        if (!string.IsNullOrEmpty(userName))
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == userName, cancellationToken);

            if (existingUser != null)
            {
                userId = existingUser.Id;
            }
        }

        try
        {
            var userAccount = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == request.UserName, cancellationToken);

            if (userAccount is null)
            {
                result.AddError(ErrorCode.NotFound, "Account Does not Exist");
                return result;
            }

            var hashedPassword = _passwordService.HashPassword(request.Password);
            userAccount.UpdatePassword(hashedPassword);

            _context.Users.Update(userAccount);
            await _context.SaveChangesAsync(cancellationToken);

            result.Message = "Operation success";
            result.Payload = Unit.Value;

            var options = new JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve,
                WriteIndented = true
            };

            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }

        return result;
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
