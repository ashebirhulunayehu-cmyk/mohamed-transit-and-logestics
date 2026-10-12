using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Queries.Shipment;
using MohamedTransit.Domain.Data;  

namespace MohamedTransit.Application.Handlers.Shipment;

public class GetAllShipmentsQueryHandler : IRequestHandler<GetAllShipmentsQuery, IEnumerable<ShipmentDto>>
{
    private readonly ApplicationDbContext _context;

    public GetAllShipmentsQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ShipmentDto>> Handle(GetAllShipmentsQuery request, CancellationToken cancellationToken)
    {
        var shipments = await _context.Shipments
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return shipments.Select(s => new ShipmentDto(
            s.Id,
            s.TrackingNumber,
            s.ImporterId,
            s.Description,
            s.Mode.ToString(),
            s.AssignedHub.ToString(),
            s.Status.ToString(),
            s.Origin,
            s.Destination,
            s.CreateAt, 
            s.UpdatedAt
        ));
    }
}
