using MediatR;

using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Common;

namespace MohamedTransit.Application.Commands.Shipment;

public record CreateServiceCommand(
    long ImporterId,
    long CreatedByUserId,
    string Description,
    TransportMode Mode,
    string Origin,
    string Destination
) : IRequest<ShipmentDto>; 
