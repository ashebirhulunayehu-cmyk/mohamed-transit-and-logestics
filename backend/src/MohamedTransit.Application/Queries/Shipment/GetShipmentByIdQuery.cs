using MediatR;

using MohamedTransit.Application.DTO;

namespace MohamedTransit.Application.Queries.Shipment;

public sealed record GetShipmentByIdQuery(long Id)
    : IRequest<ShipmentDto?>;
