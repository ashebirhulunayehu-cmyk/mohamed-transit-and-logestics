using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record UpdatePrivilegeCommand(
    long Id,
    string Action,
    string Description,
    RecordStatus? RecordStatus
) : IRequest<OperationResult<Privilege>>;

internal class UpdatePrivilegeCommandHandler : IRequestHandler<UpdatePrivilegeCommand, OperationResult<Privilege>>
{
    private readonly ApplicationDbContext _context;

    public UpdatePrivilegeCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Privilege>> Handle(UpdatePrivilegeCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Privilege>();

        try
        {
            var existingPrivilege = await _context.Privileges
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (existingPrivilege is null)
            {
                result.AddError(ErrorCode.NotFound, "Privilege Not exist.");
                return result;
            }

            // የ Privilege መረጃን ማሻሻል
            existingPrivilege.Update(request.Action, request.Description);

            if (request.RecordStatus.HasValue)
            {
                existingPrivilege.RecordStatus = request.RecordStatus.Value;
            }

            _context.Privileges.Update(existingPrivilege);
            await _context.SaveChangesAsync(cancellationToken);

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
