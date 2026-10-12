using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public class GetAllUsersQuery : IRequest<OperationResult<List<User>>>
{
    public RecordStatus? RecordStatus { get; set; }
}
