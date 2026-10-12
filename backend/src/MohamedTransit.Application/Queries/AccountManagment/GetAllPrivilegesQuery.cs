using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Queries.UserAccount;

public class GetAllPrivilegesQuery : IRequest<OperationResult<List<Privilege>>>
{
    public RecordStatus? RecordStatus { get; set; }
}
