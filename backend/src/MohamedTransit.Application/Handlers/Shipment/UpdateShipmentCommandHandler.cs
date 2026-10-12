using MediatR;

using Microsoft.EntityFrameworkCore;

using MohamedTransit.Application;
using MohamedTransit.Application.Helper;
using MohamedTransit.Domain.Common;
using MohamedTransit.Domain.Data;
using MohamedTransit.Domain.Entities;

namespace MohamedTransit.Application.Handlers.ShipmentHandler;

internal class UpdateShipmentCommandHandler : IRequestHandler<UpdateShipmentCommand, OperationResult<MohamedTransit.Domain.Entities.Shipment>>
{
    private readonly ApplicationDbContext _context;

    public UpdateShipmentCommandHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationResult<MohamedTransit.Domain.Entities.Shipment>> Handle(UpdateShipmentCommand request, CancellationToken cancellationToken)
    {
        var result = new OperationResult<MohamedTransit.Domain.Entities.Shipment>();

        // 1. Shipment ከዳታቤዝ ማረጋገጥ
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (shipment == null)
        {
            result.AddError(ErrorCode.NotFound, $"Shipment with ID '{request.Id}' was not found.");
            return result;
        }

        // 2. መረጃዎችን በ UpdateDetails ማሻሻል
        shipment.UpdateDetails(
            description: request.ItemDescription.Trim(),
            routeCategory: request.RouteCategory.Trim(),
            declaredValue: request.DeclaredValue,
            taxCategory: request.TaxCategory.Trim(),
            countryOfOrigin: request.CountryOfOrigin.Trim(),
            riskLevel: request.RiskLevel
        );

        // 3. Save ማድረግ
        await _context.SaveChangesAsync(cancellationToken);

        // 4. Result መመለስ
        result.Payload = shipment;
        result.Message = "Shipment updated successfully.";

        return result;
    }
}
