using MediatR;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Entities;
namespace MohamedTransit.Application.Commands;

public class CreateStageTransportCommand : IRequest<OperationResult<StageTransport>>
{
    public string FullName { get; set; } = string.Empty;
    public string LicenceDocument { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public long? ShipmentStageId { get; set; }
    public ProductAmount? ProductAmount { get; set; }
}
