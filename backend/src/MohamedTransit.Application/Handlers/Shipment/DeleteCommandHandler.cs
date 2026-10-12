using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application.Commands.Shipment;
using MohamedTransit.Domain.Data;

namespace MohamedTransit.Application.Handlers.Shipment;

public class DeleteShipmentCommandHandler : IRequestHandler<DeleteShipmentCommand, bool>
{
    private readonly ApplicationDbContext _context;

    public DeleteShipmentCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteShipmentCommand request, CancellationToken cancellationToken)
    {
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (shipment is null)
            return false;

        _context.Shipments.Remove(shipment);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
