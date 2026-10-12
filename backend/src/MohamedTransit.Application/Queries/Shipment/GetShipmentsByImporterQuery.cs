using MediatR;

using MohamedTransit.Application.DTO;

namespace MohamedTransit.Application.Queries.Shipment;

public sealed record GetShipmentsByImporterQuery(long ImporterId)
    : IRequest<IReadOnlyList<ShipmentDto>>;
