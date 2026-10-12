using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;
using MohamedTransit.Domain.Common;
using MohamedTransit.Application.DTO;
using MohamedTransit.Application.Commands.Shipment;

namespace MohamedTransit.Application.Handlers.Shipment;

public sealed class UpdateShipmentStatusCommandHandler
    : IRequestHandler<UpdateShipmentStatusCommand, ShipmentDto>
{
    private readonly ApplicationDbContext _context;

    public UpdateShipmentStatusCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShipmentDto> Handle(
        UpdateShipmentStatusCommand request,
        CancellationToken cancellationToken)
    {
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment is null)
        {
            throw new KeyNotFoundException(
                $"Shipment with ID '{request.ShipmentId}' was not found.");
        }

        // --- CRUD Validation & Status Update ---
        if (shipment.Status == ShipmentStatus.Deliverd || shipment.Status == ShipmentStatus.Cancelled)
        {
            throw new InvalidOperationException("Delivered or Cancelled shipment cannot be updated.");
        }

        if (shipment.Status == request.NewStatus)
        {
            throw new InvalidOperationException("Shipment is already in this status.");
        }

        // Propertyውን በቀጥታ Assign ማድረግ
        shipment.UpdateStatus(request.NewStatus);

        shipment.SetUpdated();
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
