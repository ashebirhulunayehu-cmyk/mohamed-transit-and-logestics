using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;
public record PrivilegeSeeder(List<PrivilegeDto>? PrivilegeDtos) : IRequest<OperationResult<Unit>>;
internal class PrivilegeSeederHandler : IRequestHandler<PrivilegeSeeder, OperationResult<Unit>>
{
   private readonly ApplicationDbContext _context;

    public PrivilegeSeederHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Unit>> Handle(PrivilegeSeeder request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        try
        {
            if (request.PrivilegeDtos != null && request.PrivilegeDtos.Any())
            {
                foreach (var item in request.PrivilegeDtos)
                {
                    if (item == null || string.IsNullOrEmpty(item.Action))
                        continue;

                    var existingPrivilege = await _context.Privileges
                        .FirstOrDefaultAsync(x => x.Action == item.Action, cancellationToken);

                    if (existingPrivilege is not null)
                        continue;

                    var privilege = Privilege.Create(item.Action, item.Description);
                    await _context.Privileges.AddAsync(privilege, cancellationToken);
                }

                await _context.SaveChangesAsync(cancellationToken);
            }

            result.Message = "Operation success";
            result.Payload = Unit.Value;
            return result;
        }
        catch (Exception ex)
        {
            result.AddError(ErrorCode.ServerError, ex.Message);
        }

        return result;
    }
}
