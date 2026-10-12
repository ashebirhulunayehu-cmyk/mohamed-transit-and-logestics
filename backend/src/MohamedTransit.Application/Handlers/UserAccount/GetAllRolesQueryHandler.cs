using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

internal class GetAllRolesQueryHandler : IRequestHandler<GetAllRolesQuery, OperationResult<List<Role>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllRolesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<Role>>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<Role>>();

        try
        {
            var query = _context.Roles.AsQueryable();

            if (request.RecordStatus == RecordStatus.Active)
            {
                query = query.Where(u => u.RecordStatus == RecordStatus.Active);
            }
            else if (request.RecordStatus == RecordStatus.InActive)
            {
                query = query.Where(u => u.RecordStatus == RecordStatus.InActive);
            }

            var roles = await query.ToListAsync(cancellationToken);

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
