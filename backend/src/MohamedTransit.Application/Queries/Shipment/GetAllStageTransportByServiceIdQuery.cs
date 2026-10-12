using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;

namespace Transit.Application;

public class GetAllStageTransportByServiceStageIdQuery : IRequest<OperationResult<List<StageTransport>>>
{
    public long ServiceStageId { get; set; }
}
