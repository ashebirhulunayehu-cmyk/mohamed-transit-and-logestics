using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

internal class GetAllRolePrivilegesQueryHandler : IRequestHandler<GetAllRolePrivilegesQuery, OperationResult<List<RolePrivilege>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllRolePrivilegesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<RolePrivilege>>> Handle(GetAllRolePrivilegesQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<RolePrivilege>>();

        try
        {
            var query = _context.RolePrivileges
                .Where(rp => rp.RecordStatus != RecordStatus.Delete)
                .AsQueryable();

            if (request.RecordStatus == RecordStatus.Active)
            {
                query = query.Where(rp => rp.RecordStatus == RecordStatus.Active);
            }
            else if (request.RecordStatus == RecordStatus.InActive)
            {
                query = query.Where(rp => rp.RecordStatus == RecordStatus.InActive);
            }

            var rolePrivileges = await query.ToListAsync(cancellationToken);

            if (rolePrivileges is null || rolePrivileges.Count == 0)
            {
                result.AddError(ErrorCode.Ok, "No Role Privilege Data!");
                return result;
            }

            result.Payload = rolePrivileges;
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
