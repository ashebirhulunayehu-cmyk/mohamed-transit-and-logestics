using MediatR;

using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.Commands.Shipment;

public sealed record UpdateShipmentStatusCommand(
    long ShipmentId,
    ShipmentStatus NewStatus,
    HubLocation UpdatedByHub,
    string? Remarks
) : IRequest<ShipmentDto>;
