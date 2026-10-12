using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public class GetAllRolePrivilegesQuery : IRequest<OperationResult<List<RolePrivilege>>>
{
    public RecordStatus? RecordStatus { get; set; }
}
