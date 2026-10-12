using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries.Shipment;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers.Shipment;

public class GetShipmentByIdQueryHandler : IRequestHandler<GetShipmentByIdQuery, ShipmentDto?>
{
    private readonly ApplicationDbContext _context;

    public GetShipmentByIdQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShipmentDto?> Handle(GetShipmentByIdQuery request, CancellationToken cancellationToken)
    {
        var shipment = await _context.Shipments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (shipment is null)
        {
            return null;
        }

        return new ShipmentDto(
            shipment.Id,
            shipment.TrackingNumber, // .Value ተወግዷል
            shipment.ImporterId,
            shipment.Description,
            shipment.Mode.ToString(),
            shipment.AssignedHub.ToString(),
            shipment.Status.ToString(),
            shipment.Origin,         // shipment.Route.Origin የነበረው ተስተካክሏል
            shipment.Destination,    // shipment.Route.Destination የነበረው ተስተካክሏል
            shipment.CreateAt,
            shipment.UpdatedAt
        );
    }
}
