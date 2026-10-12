using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public class GetAllRolesQuery : IRequest<OperationResult<List<Role>>>
{
    public RecordStatus? RecordStatus { get; set; }
}
