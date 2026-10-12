using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record DeletePrivilegeCommand(long Id) : IRequest<OperationResult<Unit>>;

public class DeletePrivilegeCommandHandler : IRequestHandler<DeletePrivilegeCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;

    public DeletePrivilegeCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Unit>> Handle(DeletePrivilegeCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        // 1. Privileges DbSet በመጠቀም Soft Delete ያልተደረገውን Privilege መፈለግ
        var existingPrivilege = await _context.Privileges
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.RecordStatus != RecordStatus.Delete, cancellationToken);

        if (existingPrivilege is null)
        {
            result.AddError(ErrorCode.NotFound, "Privilege Not found.");
            return result;
        }

        // 2. Status ወደ Delete መቀየር
        existingPrivilege.UpdateStatus(RecordStatus.Delete);

        _context.Privileges.Update(existingPrivilege);
        await _context.SaveChangesAsync(cancellationToken);

        result.Message = "Privilege deleted successfully.";
        result.Payload = Unit.Value;

        return result;
    }
}
