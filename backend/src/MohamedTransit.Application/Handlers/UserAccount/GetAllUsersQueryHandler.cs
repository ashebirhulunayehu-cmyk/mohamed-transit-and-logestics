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

internal class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, OperationResult<List<User>>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TokenHandlerService _tokenHandlerService;

    public GetAllUsersQueryHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        TokenHandlerService tokenHandlerService)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tokenHandlerService = tokenHandlerService;
    }

    public async Task<OperationResult<List<User>>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<User>>();
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
            var query = _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .AsQueryable();

            if (request.RecordStatus == RecordStatus.Active)
            {
                query = query.Where(u => u.RecordStatus == RecordStatus.Active);
            }
            else if (request.RecordStatus == RecordStatus.InActive)
            {
                query = query.Where(u => u.RecordStatus == RecordStatus.InActive);
            }


            var users = await query.ToListAsync(cancellationToken);

            // ዳታ ባይኖርም እንኳን ባዶ List Payload ላይ አድርጎ 200 OK ይመልሳል
            result.Payload = users ?? new List<User>();
            result.Message = users?.Any() == true ? "Operation success" : "No users found";

            return result;
            result.Payload = users;
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
