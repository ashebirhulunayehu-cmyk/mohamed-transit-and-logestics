using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries.Shipment;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers.Shipment;

public class GetShipmentsByImporterQueryHandler
: IRequestHandler<GetShipmentsByImporterQuery, IReadOnlyList<ShipmentDto>>
{
    private readonly ApplicationDbContext _context;

    public GetShipmentsByImporterQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ShipmentDto>> Handle(
        GetShipmentsByImporterQuery request,
        CancellationToken cancellationToken)
    {
        var shipments = await _context.Shipments
            .AsNoTracking()
            .Where(s => s.ImporterId == request.ImporterId)
            .Select(shipment => new ShipmentDto(
                shipment.Id,
                shipment.TrackingNumber,
                shipment.ImporterId,
                shipment.Description,
                shipment.Mode.ToString(),
                shipment.AssignedHub.ToString(),
                shipment.Status.ToString(),
                shipment.Origin,
                shipment.Destination,
                shipment.CreateAt,
                shipment.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        return shipments;
    }
}
