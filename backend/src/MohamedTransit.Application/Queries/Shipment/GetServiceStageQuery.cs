using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Entities;



namespace MohamedTransit.Application;

public class GetServiceStagesQuery : IRequest<OperationResult<List<ServiceStageExecution>>>
{
    public long ShipmentId { get; set; }
}

