using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public record GetRoleById(long Id) : IRequest<OperationResult<Role>>;

internal class GetRoleByIdHandler : IRequestHandler<GetRoleById, OperationResult<Role>>
{
    private readonly ApplicationDbContext _context;

    public GetRoleByIdHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Role>> Handle(GetRoleById request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Role>();

        try
        {
            var existingRole = await _context.Roles
                .Include(r => r.RolePrivileges)
                    .ThenInclude(rp => rp.Privilege)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (existingRole is null)
            {
                result.AddError(ErrorCode.Ok, "Role Not exist.");
                return result;
            }

            result.Payload = existingRole;
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
