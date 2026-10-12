using MediatR;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands.UserAccount;
using MohamedTransit.Application.Helper;
using MohamedTransit.Application.Service;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.UserAccount;

internal class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, OperationResult<Role>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private ISession? _session => _httpContextAccessor.HttpContext?.Session;

    public CreateRoleCommandHandler(ApplicationDbContext context, PasswordService password, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _passwordService = password;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<Role>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Role>();

        // 1. ሮሉ በስም መኖሩን ማረጋገጥ
        var existingRole = await _context.Roles.FirstOrDefaultAsync(x => x.Name == request.Name, cancellationToken);
        if (existingRole is not null)
        {
            result.AddError(ErrorCode.RecordFound, "Role already exist.");
            return result;
        }

        // 2. ሮሉን መፍጠር (Role.Create ይጠቀማል)
        var role = Role.Create(request.Name, request.Description);
        await _context.Roles.AddAsync(role, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 3. ፕሪቪሌጆቹን ማያያዝ
        if (request.Privileges is { Count: > 0 })
        {
            foreach (var permissionId in request.Privileges)
            {
                var rolePrivilege = new RolePrivilege
                {
                    PrivilegeId = permissionId,
                    RoleId = role.Id
                };

                // ኤንቲቲው ላይ ያለውን የተዘጋጀ ሜቶድ መጠቀም ይቻላል ወይም በቀጥታ መጨመር
                role.AddRolePrivilege(rolePrivilege);
                await _context.AddAsync(rolePrivilege, cancellationToken);
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 4. የተፈጠረውን ሮል ከነ ፕሪቪሌጆቹ (Include) ጋር ከዳታቤዝ ዳግም መጥራት
        var createdRole = await _context.Roles
            .Include(r => r.RolePrivileges)
            .FirstOrDefaultAsync(r => r.Id == role.Id, cancellationToken);

        result.Payload = createdRole ?? role;
        result.Message = "Operation success";

        return result;
    }
}
