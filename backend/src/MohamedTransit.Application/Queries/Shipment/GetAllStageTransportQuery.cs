

using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;



namespace MohamedTransit.Application;

public class GetAllStageTransportQuery : IRequest<OperationResult<List<StageTransport>>>
{

    public RecordStatus? RecordStatus { get; set; }
}
