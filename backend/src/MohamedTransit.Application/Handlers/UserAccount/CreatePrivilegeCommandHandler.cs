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

internal class CreatePrivilegeCommandHandler : IRequestHandler<CreatePrivilegeCommand, OperationResult<Privilege>>
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private ISession? _session => _httpContextAccessor.HttpContext?.Session;

    public CreatePrivilegeCommandHandler(ApplicationDbContext context, PasswordService password, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _passwordService = password;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<OperationResult<Privilege>> Handle(CreatePrivilegeCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<Privilege>();

        var existingPrivilege = await _context.Privileges.FirstOrDefaultAsync(x => x.Action == request.Action, cancellationToken);
        if (existingPrivilege is not null)
        {
            result.AddError(ErrorCode.RecordFound, "Privilege already exist.");
            return result;
        }

        var privilege = Privilege.Create(request.Action, request.Description);
        await _context.Privileges.AddAsync(privilege, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        result.Payload = privilege;
        result.Message = "Operation success";

        return result;
    }
}
