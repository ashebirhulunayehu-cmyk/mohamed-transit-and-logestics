using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Commands.UserAccount;

public record AddRolePrivilege(
    long RoleId,
    List<long> Privileges
) : IRequest<OperationResult<Unit>>;

internal class AddRolePrivilegeHandler
    : IRequestHandler<AddRolePrivilege, OperationResult<Unit>>
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private ISession _session =>
        _httpContextAccessor.HttpContext!.Session;

    public AddRolePrivilegeHandler(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<Unit>> Handle(
        AddRolePrivilege request,
        CancellationToken cancellationToken)
    {
        var result = new OperationResult<Unit>();

        // Find Role
        var role = await _context.Roles
            .FirstOrDefaultAsync(
                x => x.Id == request.RoleId,
                cancellationToken);

        if (role is null)
        {
            result.AddError(
                ErrorCode.NotFound,
                "Role not found.");

            return result;
        }

        // Get existing RolePrivileges
        var existedRolePrivileges = await _context.RolePrivileges
            .Where(r => r.RoleId == request.RoleId)
            .ToListAsync(cancellationToken);

        // Remove existing privileges
        _context.RolePrivileges.RemoveRange(existedRolePrivileges);

        await _context.SaveChangesAsync(cancellationToken);

        // Add new privileges
        foreach (var privilegeId in request.Privileges)
        {
            role.AddRolePrivilege(
                new RolePrivilege
                {
                    RoleId = role.Id,
                    PrivilegeId = privilegeId
                });
        }

        await _context.SaveChangesAsync(cancellationToken);

        result.Message = "Operation success";

        return result;
    }
}
