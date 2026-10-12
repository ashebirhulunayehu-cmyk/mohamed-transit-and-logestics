using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

internal class GetAllPrivilegesQueryHandler : IRequestHandler<GetAllPrivilegesQuery, OperationResult<List<Privilege>>>
{
    private readonly ApplicationDbContext _context;

    public GetAllPrivilegesQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<List<Privilege>>> Handle(GetAllPrivilegesQuery request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<List<Privilege>>();

        try
        {
            var query = _context.Privileges.AsQueryable();

            if (request.RecordStatus.HasValue)
            {
                query = query.Where(u => u.RecordStatus == request.RecordStatus.Value);
            }

            var privileges = await query.ToListAsync(cancellationToken);

            if (privileges.Count == 0)
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
