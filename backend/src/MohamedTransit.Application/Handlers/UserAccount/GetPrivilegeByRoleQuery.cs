using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public record GetPrivilegeByRoleQuery(long RoleId) : IRequest<OperationResult<List<Privilege>>>;

internal class GetPrivilegeByRoleQueryHandler : IRequestHandler<GetPrivilegeByRoleQuery, OperationResult<List<Privilege>>>
{
    private readonly ApplicationDbContext _context;

    public GetPrivilegeByRoleQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<Privilege>>> Handle(GetPrivilegeByRoleQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<Privilege>>();

        try
        {
            var privileges = await _context.RolePrivileges
                .Where(rp => rp.RoleId == request.RoleId)
                .Include(rp => rp.Privilege)
                .Select(rp => rp.Privilege)
                .ToListAsync(cancellationToken);

            if (privileges is null || privileges.Count == 0)
            {
                result.AddError(ErrorCode.Ok, "No Privilege Data!");
                return result;
            }

            result.Payload = privileges;
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
