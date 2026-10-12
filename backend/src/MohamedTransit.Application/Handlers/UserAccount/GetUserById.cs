using System.Text.Json;

using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public record GetUserById(long Id) : IRequest<OperationResult<User>>;

internal class GetUserByIdHandler : IRequestHandler<GetUserById, OperationResult<User>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public GetUserByIdHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<User>> Handle(GetUserById request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<User>();
        var userName = GetCurrentUserName();

        long userId = 0;
        if (!string.IsNullOrEmpty(userName))
        {
            var loggedInUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == userName, cancellationToken);

            if (loggedInUser != null)
            {
                userId = loggedInUser.Id;
            }
        }

        try
        {
            var existingUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (existingUser is null)
            {
                result.AddError(ErrorCode.Ok, "User Not exist.");
                return result;
            }

            result.Payload = existingUser;
            result.Message = "Operation success";

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
        var claims = _tokenHandlerService.GetClaims(token);

        var userNameClaim = claims?.FirstOrDefault(c => c.Type == "userName");
        return userNameClaim?.Value;
    }
}
