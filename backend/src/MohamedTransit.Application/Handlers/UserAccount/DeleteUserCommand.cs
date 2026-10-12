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

public record DeleteUserCommand(long Id) : IRequest<OperationResult<Unit>>;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public DeleteUserCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<Unit>> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        // 1. Userውን ከነ UserRoles ጋር አብሮ መፈለግ
        var existingUser = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (existingUser is null)
        {
            result.AddError(ErrorCode.NotFound, "User Not found.");
            return result;
        }

        // 2. ቅድሚያ የተያያዙትን UserRoles ማጥፋት
        if (existingUser.UserRoles != null && existingUser.UserRoles.Any())
        {
            _context.UserRoles.RemoveRange(existingUser.UserRoles);
        }

        // 3. አሁን Userውን ከ Database ማጥፋት
        _context.Users.Remove(existingUser);

        await _context.SaveChangesAsync(cancellationToken);

        result.Message = "User and associated roles deleted successfully.";
        result.Payload = Unit.Value;

        return result;
    }

    private string? GetCurrentUserName()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null) return null;

        var authorizationHeader = httpContext.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
            return null;
        }

        var token = authorizationHeader["Bearer ".Length..].Trim();
        var claims = _tokenHandlerService.GetClaims(token);

        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value;
    }
}
