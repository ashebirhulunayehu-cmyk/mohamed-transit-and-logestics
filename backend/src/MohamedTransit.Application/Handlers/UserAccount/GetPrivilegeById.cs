using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public record GetPrivilegeById(long Id) : IRequest<OperationResult<Privilege>>;

internal class GetPrivilegeByIdHandler : IRequestHandler<GetPrivilegeById, OperationResult<Privilege>>
{
    private readonly ApplicationDbContext _context;

    public GetPrivilegeByIdHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Privilege>> Handle(GetPrivilegeById request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Privilege>();

        try
        {
            var existingPrivilege = await _context.Privileges
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (existingPrivilege is null)
            {
                result.AddError(ErrorCode.Ok, "Privilege Not exist.");
                return result;
            }

            result.Payload = existingPrivilege;
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
