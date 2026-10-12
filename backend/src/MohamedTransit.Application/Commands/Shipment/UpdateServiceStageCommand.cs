using MediatR;

using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application;
public class UpdateServiceStageCommand : IRequest<OperationResult<ServiceStageExecution>>
{
    public long ShipmentStageId { get; set; }
    public long ShipmentId { get; set; }
    public StageStatus Status { get; set; }
    public string? Notes { get; set; }
    public long UpdatedByUserId { get; set; }
}

