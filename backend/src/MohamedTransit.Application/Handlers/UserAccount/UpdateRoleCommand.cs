using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record UpdateRoleCommand(
    long Id,
    string Name,
    string Description,
    List<long> Privileges,
    RecordStatus? RecordStatus
) : IRequest<OperationResult<Role>>;

internal class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, OperationResult<Role>>
{
    private readonly ApplicationDbContext _context;

    public UpdateRoleCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<Role>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Role>();

        try
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (role is null)
            {
                result.AddError(ErrorCode.NotFound, "Role Not exist.");
                return result;
            }

            // የ Role መረጃ ማሻሻል
            role.Update(request.Name, request.Description, request.RecordStatus);

            _context.Roles.Update(role);

            // ነባር RolePrivileges ማጽዳት
            var existedRolePrivileges = await _context.RolePrivileges
                .Where(r => r.RoleId == request.Id)
                .ToListAsync(cancellationToken);

            _context.RolePrivileges.RemoveRange(existedRolePrivileges);
            await _context.SaveChangesAsync(cancellationToken);

            // አዳዲስ Privileges ማያያዝ
            if (request.Privileges != null && request.Privileges.Count > 0)
            {
                foreach (var privilegeId in request.Privileges)
                {
                    role.AddRolePrivilege(new RolePrivilege
                    {
                        RoleId = role.Id,
                        PrivilegeId = privilegeId
                    });
                }
                await _context.SaveChangesAsync(cancellationToken);
            }

            result.Payload = role;
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
