using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands.Shipment;
using MohamedTransit.Application.DTO;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.Shipment;

public class CreateShipmentCommandHandler
    : IRequestHandler<CreateServiceCommand, ShipmentDto>
{
    private readonly ApplicationDbContext _context;

    public CreateShipmentCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShipmentDto> Handle(
        CreateServiceCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Importer በዳታቤዝ ውስጥ መኖሩን ማረጋገጥ (AsNoTracking በመጠቀም Lock እንዳይፈጥር ማድረግ)
        var importerExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.ImporterId, cancellationToken);

        if (!importerExists)
        {
            throw new KeyNotFoundException($"Importer with ID {request.ImporterId} does not exist.");
        }
        // 2. Unique Tracking Number ማፍለቅ
        long generatedLongId = DateTime.UtcNow.Ticks; 

        var shipment = MohamedTransit.Domain.Entities.Shipment.Create(
            $"MT-{generatedLongId}",                     // 1. trackingNumber
            request.Description,                         // 2. v 
            request.ImporterId,                          // 3. importerId
            request.Description,                         // 4. description
            request.Mode,                                // 5. mode
            request.Mode == TransportMode.MultiModalSeaRail
                ? HubLocation.Mojo
                : HubLocation.Adama,                     // 6. assignedHub
            request.Origin,                              // 7. origin
            request.Destination,                         // 8. destination
            request.ImporterId                           // 9. createdByUserI//d
        );
        _context.Shipments.Add(shipment);

        await _context.SaveChangesAsync(cancellationToken);

        return new ShipmentDto(
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
        );
    }
}
