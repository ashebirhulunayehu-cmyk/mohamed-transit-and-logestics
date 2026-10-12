using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record DeleteRoleCommand(long Id) : IRequest<OperationResult<Unit>>;

public class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeleteRoleCommandHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<Unit>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        // 1. Roles DbSet በመጠቀም Soft Delete ያልተደረገውን Role መፈለግ
        var existingRole = await _context.Roles
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.RecordStatus != RecordStatus.Delete, cancellationToken);

        if (existingRole is null)
        {
            result.AddError(ErrorCode.NotFound, "Role Not found.");
            return result;
        }

        // 2. Status ወደ Delete መቀየር (በ UpdateStatus method ወይም Direct Assignment)
        existingRole.UpdateStatus(RecordStatus.Delete);

        _context.Roles.Update(existingRole);
        await _context.SaveChangesAsync(cancellationToken);

        result.Message = "Role deleted successfully.";
        result.Payload = Unit.Value;

        return result;
    }
}
