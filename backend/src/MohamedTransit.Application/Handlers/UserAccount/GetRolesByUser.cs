using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public record GetRolesByUser(long UserId) : IRequest<OperationResult<List<Role>>>;

internal class GetRolesByUserHandler : IRequestHandler<GetRolesByUser, OperationResult<List<Role>>>
{
    private readonly ApplicationDbContext _context;

    public GetRolesByUserHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<Role>>> Handle(GetRolesByUser request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<Role>>();

        try
        {
            var roles = await _context.UserRoles
                .Where(ur => ur.UserId == request.UserId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role)
                .ToListAsync(cancellationToken);

            if (roles is null || roles.Count == 0)
            {
                result.AddError(ErrorCode.Ok, "No Roles Data!");
                return result;
            }

            result.Payload = roles;
            result.Message = "Operation success";
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }

        return result;
    }
}
